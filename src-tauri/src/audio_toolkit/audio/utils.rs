use anyhow::Result;
use hound::{WavReader, WavSpec, WavWriter};
use log::debug;
use std::path::Path;

/// Load audio samples from a WAV file, converting i16 samples back to f32
pub fn load_wav_file<P: AsRef<Path>>(file_path: P) -> Result<Vec<f32>> {
    let reader = WavReader::open(file_path.as_ref())?;
    let samples: Vec<f32> = reader
        .into_samples::<i16>()
        .map(|s| s.map(|v| v as f32 / i16::MAX as f32))
        .collect::<std::result::Result<Vec<f32>, _>>()?;
    debug!(
        "Loaded WAV file: {:?} ({} samples)",
        file_path.as_ref(),
        samples.len()
    );
    Ok(samples)
}

/// Save audio samples as a WAV file
pub async fn save_wav_file<P: AsRef<Path>>(file_path: P, samples: &[f32]) -> Result<()> {
    let spec = WavSpec {
        channels: 1,
        sample_rate: 16000,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut writer = WavWriter::create(file_path.as_ref(), spec)?;

    // Convert f32 samples to i16 for WAV
    for sample in samples {
        let sample_i16 = (sample.clamp(-1.0, 1.0) * i16::MAX as f32) as i16;
        writer.write_sample(sample_i16)?;
    }

    writer.finalize()?;
    debug!("Saved WAV file: {:?}", file_path.as_ref());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn wav_round_trip_preserves_samples() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("test.wav");

        let original: Vec<f32> = vec![0.0, 0.5, -0.5, 0.25, -0.25, 1.0, -1.0];
        save_wav_file(&path, &original).await.unwrap();

        let loaded = load_wav_file(&path).unwrap();
        assert_eq!(loaded.len(), original.len());

        // Due to f32->i16->f32 conversion there will be quantization error
        // i16 has ~15-bit precision, so error should be < 1/32768 ≈ 3e-5
        for (orig, loaded) in original.iter().zip(loaded.iter()) {
            assert!(
                (orig - loaded).abs() < 0.001,
                "Sample mismatch: original={}, loaded={}",
                orig,
                loaded
            );
        }
    }

    #[tokio::test]
    async fn wav_round_trip_empty_samples() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("empty.wav");

        save_wav_file(&path, &[]).await.unwrap();
        let loaded = load_wav_file(&path).unwrap();
        assert!(loaded.is_empty());
    }

    #[tokio::test]
    async fn wav_round_trip_silence() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("silence.wav");

        let silence: Vec<f32> = vec![0.0; 16000]; // 1 second of silence
        save_wav_file(&path, &silence).await.unwrap();

        let loaded = load_wav_file(&path).unwrap();
        assert_eq!(loaded.len(), 16000);
        for sample in &loaded {
            assert!((sample.abs()) < 1e-5);
        }
    }

    #[test]
    fn load_nonexistent_file_returns_error() {
        let result = load_wav_file("/nonexistent/path/file.wav");
        assert!(result.is_err());
    }
}
