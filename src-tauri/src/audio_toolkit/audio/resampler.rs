use rubato::{FftFixedIn, Resampler};
use std::time::Duration;

// Make this a constant you can tweak
const RESAMPLER_CHUNK_SIZE: usize = 1024;

pub struct FrameResampler {
    resampler: Option<FftFixedIn<f32>>,
    chunk_in: usize,
    in_buf: Vec<f32>,
    frame_samples: usize,
    pending: Vec<f32>,
}

impl FrameResampler {
    pub fn new(in_hz: usize, out_hz: usize, frame_dur: Duration) -> Self {
        let frame_samples = ((out_hz as f64 * frame_dur.as_secs_f64()).round()) as usize;
        assert!(frame_samples > 0, "frame duration too short");

        // Use fixed chunk size instead of GCD-based
        let chunk_in = RESAMPLER_CHUNK_SIZE;

        let resampler = (in_hz != out_hz).then(|| {
            FftFixedIn::<f32>::new(in_hz, out_hz, chunk_in, 1, 1)
                .expect("Failed to create resampler")
        });

        Self {
            resampler,
            chunk_in,
            in_buf: Vec::with_capacity(chunk_in),
            frame_samples,
            pending: Vec::with_capacity(frame_samples),
        }
    }

    pub fn push(&mut self, mut src: &[f32], mut emit: impl FnMut(&[f32])) {
        if self.resampler.is_none() {
            self.emit_frames(src, &mut emit);
            return;
        }

        while !src.is_empty() {
            let space = self.chunk_in - self.in_buf.len();
            let take = space.min(src.len());
            self.in_buf.extend_from_slice(&src[..take]);
            src = &src[take..];

            if self.in_buf.len() == self.chunk_in {
                if let Ok(out) = self
                    .resampler
                    .as_mut()
                    .unwrap()
                    .process(&[&self.in_buf[..]], None)
                {
                    self.emit_frames(&out[0], &mut emit);
                }
                self.in_buf.clear();
            }
        }
    }

    pub fn finish(&mut self, mut emit: impl FnMut(&[f32])) {
        // Process any remaining input samples
        if let Some(ref mut resampler) = self.resampler {
            if !self.in_buf.is_empty() {
                // Pad with zeros to reach chunk size
                self.in_buf.resize(self.chunk_in, 0.0);
                if let Ok(out) = resampler.process(&[&self.in_buf[..]], None) {
                    self.emit_frames(&out[0], &mut emit);
                }
            }
        }

        // Emit any remaining pending frame (padded with zeros)
        if !self.pending.is_empty() {
            self.pending.resize(self.frame_samples, 0.0);
            emit(&self.pending);
            self.pending.clear();
        }
    }

    fn emit_frames(&mut self, mut data: &[f32], emit: &mut impl FnMut(&[f32])) {
        while !data.is_empty() {
            let space = self.frame_samples - self.pending.len();
            let take = space.min(data.len());
            self.pending.extend_from_slice(&data[..take]);
            data = &data[take..];

            if self.pending.len() == self.frame_samples {
                emit(&self.pending);
                self.pending.clear();
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 30ms at 16kHz = 480 samples
    const FRAME_SAMPLES_16K_30MS: usize = 480;

    #[test]
    fn passthrough_when_same_sample_rate() {
        let mut resampler = FrameResampler::new(16000, 16000, Duration::from_millis(30));
        let input: Vec<f32> = (0..FRAME_SAMPLES_16K_30MS)
            .map(|i| i as f32 / FRAME_SAMPLES_16K_30MS as f32)
            .collect();

        let mut frames = Vec::new();
        resampler.push(&input, |f| frames.push(f.to_vec()));

        assert_eq!(frames.len(), 1);
        assert_eq!(frames[0].len(), FRAME_SAMPLES_16K_30MS);
        assert_eq!(frames[0], input);
    }

    #[test]
    fn passthrough_emits_multiple_frames() {
        let mut resampler = FrameResampler::new(16000, 16000, Duration::from_millis(30));
        let input: Vec<f32> = vec![0.5; FRAME_SAMPLES_16K_30MS * 3];

        let mut frames = Vec::new();
        resampler.push(&input, |f| frames.push(f.to_vec()));

        assert_eq!(frames.len(), 3);
        for frame in &frames {
            assert_eq!(frame.len(), FRAME_SAMPLES_16K_30MS);
        }
    }

    #[test]
    fn passthrough_partial_frame_buffered() {
        let mut resampler = FrameResampler::new(16000, 16000, Duration::from_millis(30));
        let input: Vec<f32> = vec![0.1; FRAME_SAMPLES_16K_30MS / 2];

        let mut frames = Vec::new();
        resampler.push(&input, |f| frames.push(f.to_vec()));

        assert_eq!(frames.len(), 0);
    }

    #[test]
    fn finish_emits_padded_remaining() {
        let mut resampler = FrameResampler::new(16000, 16000, Duration::from_millis(30));
        let partial_len = FRAME_SAMPLES_16K_30MS / 2;
        let input: Vec<f32> = vec![0.7; partial_len];

        let mut frames = Vec::new();
        resampler.push(&input, |f| frames.push(f.to_vec()));
        assert_eq!(frames.len(), 0);

        resampler.finish(|f| frames.push(f.to_vec()));
        assert_eq!(frames.len(), 1);
        assert_eq!(frames[0].len(), FRAME_SAMPLES_16K_30MS);
        for &s in &frames[0][..partial_len] {
            assert!((s - 0.7).abs() < 1e-6);
        }
        for &s in &frames[0][partial_len..] {
            assert!(s.abs() < 1e-6);
        }
    }

    #[test]
    fn finish_noop_when_no_pending() {
        let mut resampler = FrameResampler::new(16000, 16000, Duration::from_millis(30));
        let input: Vec<f32> = vec![0.5; FRAME_SAMPLES_16K_30MS];

        let mut frames = Vec::new();
        resampler.push(&input, |f| frames.push(f.to_vec()));
        assert_eq!(frames.len(), 1);

        resampler.finish(|f| frames.push(f.to_vec()));
        assert_eq!(frames.len(), 1);
    }

    #[test]
    fn resampling_produces_output() {
        let mut resampler = FrameResampler::new(48000, 16000, Duration::from_millis(30));
        let input: Vec<f32> = vec![0.0; 48000]; // 1 second at 48kHz

        let mut frames = Vec::new();
        resampler.push(&input, |f| frames.push(f.to_vec()));
        resampler.finish(|f| frames.push(f.to_vec()));

        assert!(!frames.is_empty(), "Resampler should produce output frames");
        for frame in &frames {
            assert_eq!(frame.len(), FRAME_SAMPLES_16K_30MS);
        }
    }
}
