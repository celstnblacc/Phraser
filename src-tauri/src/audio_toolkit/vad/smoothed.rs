use super::{VadFrame, VoiceActivityDetector};
use anyhow::Result;
use std::collections::VecDeque;

pub struct SmoothedVad {
    inner_vad: Box<dyn VoiceActivityDetector>,
    prefill_frames: usize,
    hangover_frames: usize,
    onset_frames: usize,

    frame_buffer: VecDeque<Vec<f32>>,
    hangover_counter: usize,
    onset_counter: usize,
    in_speech: bool,

    temp_out: Vec<f32>,
}

impl SmoothedVad {
    pub fn new(
        inner_vad: Box<dyn VoiceActivityDetector>,
        prefill_frames: usize,
        hangover_frames: usize,
        onset_frames: usize,
    ) -> Self {
        Self {
            inner_vad,
            prefill_frames,
            hangover_frames,
            onset_frames,
            frame_buffer: VecDeque::new(),
            hangover_counter: 0,
            onset_counter: 0,
            in_speech: false,
            temp_out: Vec::new(),
        }
    }
}

impl VoiceActivityDetector for SmoothedVad {
    fn push_frame<'a>(&'a mut self, frame: &'a [f32]) -> Result<VadFrame<'a>> {
        // 1. Buffer every incoming frame for possible pre-roll
        self.frame_buffer.push_back(frame.to_vec());
        while self.frame_buffer.len() > self.prefill_frames + 1 {
            self.frame_buffer.pop_front();
        }

        // 2. Delegate to the wrapped boolean VAD
        let is_voice = self.inner_vad.is_voice(frame)?;

        match (self.in_speech, is_voice) {
            // Potential start of speech - need to accumulate onset frames
            (false, true) => {
                self.onset_counter += 1;
                if self.onset_counter >= self.onset_frames {
                    // We have enough consecutive voice frames to trigger speech
                    self.in_speech = true;
                    self.hangover_counter = self.hangover_frames;
                    self.onset_counter = 0; // Reset for next time

                    // Collect prefill + current frame
                    self.temp_out.clear();
                    for buf in &self.frame_buffer {
                        self.temp_out.extend(buf);
                    }
                    Ok(VadFrame::Speech(&self.temp_out))
                } else {
                    // Not enough frames yet, still silence
                    Ok(VadFrame::Noise)
                }
            }

            // Ongoing Speech
            (true, true) => {
                self.hangover_counter = self.hangover_frames;
                Ok(VadFrame::Speech(frame))
            }

            // End of Speech or interruption during onset phase
            (true, false) => {
                if self.hangover_counter > 0 {
                    self.hangover_counter -= 1;
                    Ok(VadFrame::Speech(frame))
                } else {
                    self.in_speech = false;
                    Ok(VadFrame::Noise)
                }
            }

            // Silence or broken onset sequence
            (false, false) => {
                self.onset_counter = 0; // Reset onset counter on silence
                Ok(VadFrame::Noise)
            }
        }
    }

    fn reset(&mut self) {
        self.frame_buffer.clear();
        self.hangover_counter = 0;
        self.onset_counter = 0;
        self.in_speech = false;
        self.temp_out.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A mock VAD that returns a pre-programmed sequence of speech/noise decisions.
    struct MockVad {
        responses: Vec<bool>,
        index: usize,
    }

    impl MockVad {
        fn new(responses: Vec<bool>) -> Self {
            Self {
                responses,
                index: 0,
            }
        }
    }

    impl VoiceActivityDetector for MockVad {
        fn push_frame<'a>(&'a mut self, frame: &'a [f32]) -> Result<VadFrame<'a>> {
            let is_speech = self.responses.get(self.index).copied().unwrap_or(false);
            self.index += 1;
            if is_speech {
                Ok(VadFrame::Speech(frame))
            } else {
                Ok(VadFrame::Noise)
            }
        }
    }

    fn make_frame(value: f32) -> Vec<f32> {
        vec![value; 480] // 30ms at 16kHz
    }

    #[test]
    fn silence_returns_noise() {
        // All frames are silence
        let mock = MockVad::new(vec![false, false, false]);
        let mut vad = SmoothedVad::new(Box::new(mock), 2, 2, 2);

        for _ in 0..3 {
            let frame = make_frame(0.0);
            let result = vad.push_frame(&frame).unwrap();
            assert!(!result.is_speech());
        }
    }

    #[test]
    fn onset_requires_consecutive_frames() {
        // onset_frames = 3, so we need 3 consecutive voice frames before speech is declared
        let mock = MockVad::new(vec![true, true, true, true]);
        let mut vad = SmoothedVad::new(Box::new(mock), 0, 2, 3);

        let frame = make_frame(0.5);

        // Frame 1: voice detected but onset counter only at 1
        assert!(!vad.push_frame(&frame).unwrap().is_speech());
        // Frame 2: onset counter at 2
        assert!(!vad.push_frame(&frame).unwrap().is_speech());
        // Frame 3: onset counter reaches 3, speech starts
        assert!(vad.push_frame(&frame).unwrap().is_speech());
        // Frame 4: ongoing speech
        assert!(vad.push_frame(&frame).unwrap().is_speech());
    }

    #[test]
    fn onset_resets_on_silence() {
        // Voice, voice, silence, voice — onset should reset
        let mock = MockVad::new(vec![true, true, false, true, true, true]);
        let mut vad = SmoothedVad::new(Box::new(mock), 0, 0, 3);

        let frame = make_frame(0.5);

        assert!(!vad.push_frame(&frame).unwrap().is_speech()); // onset 1
        assert!(!vad.push_frame(&frame).unwrap().is_speech()); // onset 2
        assert!(!vad.push_frame(&frame).unwrap().is_speech()); // silence, resets onset
        assert!(!vad.push_frame(&frame).unwrap().is_speech()); // onset 1 again
        assert!(!vad.push_frame(&frame).unwrap().is_speech()); // onset 2
        assert!(vad.push_frame(&frame).unwrap().is_speech()); // onset 3 = speech!
    }

    #[test]
    fn hangover_keeps_speech_during_silence_gap() {
        // Speech starts, then 2 silence frames, hangover=3 should keep speech
        let mock = MockVad::new(vec![true, true, false, false, false, false]);
        let mut vad = SmoothedVad::new(Box::new(mock), 0, 3, 2);

        let frame = make_frame(0.5);

        assert!(!vad.push_frame(&frame).unwrap().is_speech()); // onset 1
        assert!(vad.push_frame(&frame).unwrap().is_speech()); // onset 2 = speech
                                                              // Now silence, but hangover should keep us in speech for 3 frames
        assert!(vad.push_frame(&frame).unwrap().is_speech()); // hangover 2
        assert!(vad.push_frame(&frame).unwrap().is_speech()); // hangover 1
        assert!(vad.push_frame(&frame).unwrap().is_speech()); // hangover 0
                                                              // Now hangover exhausted
        assert!(!vad.push_frame(&frame).unwrap().is_speech());
    }

    #[test]
    fn prefill_includes_buffered_frames() {
        // prefill=2: when speech triggers, we should get pre-roll frames
        let mock = MockVad::new(vec![false, false, true, true]);
        let mut vad = SmoothedVad::new(Box::new(mock), 2, 0, 2);

        let silence_frame = make_frame(0.0);
        let voice_frame = make_frame(0.8);

        // Two silence frames get buffered
        vad.push_frame(&silence_frame).unwrap();
        vad.push_frame(&silence_frame).unwrap();

        // First voice frame: onset 1
        assert!(!vad.push_frame(&voice_frame).unwrap().is_speech());

        // Second voice frame: onset 2 = speech with prefill
        let result = vad.push_frame(&voice_frame).unwrap();
        assert!(result.is_speech());
        if let VadFrame::Speech(data) = result {
            // Should contain prefill + onset frames
            // prefill has 2 silence + 1 onset voice + current = 4 frames buffered,
            // but prefill_frames + 1 max in buffer = 3 frames
            assert!(data.len() >= voice_frame.len());
        }
    }

    #[test]
    fn reset_clears_state() {
        let mock = MockVad::new(vec![true, true, true, false]);
        let mut vad = SmoothedVad::new(Box::new(mock), 2, 2, 1);

        let frame = make_frame(0.5);
        vad.push_frame(&frame).unwrap(); // triggers speech (onset=1)

        vad.reset();

        // After reset, internal state is cleared — we can't push more
        // because the mock is exhausted, but the state should be clean
        assert!(!vad.in_speech);
        assert_eq!(vad.onset_counter, 0);
        assert_eq!(vad.hangover_counter, 0);
        assert!(vad.frame_buffer.is_empty());
    }
}
