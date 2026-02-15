#!/usr/bin/env python3
"""
MUSA-Native ASR Service using MooER
Moore Threads' LLM-based Speech Recognition Model
Optimized for MUSA GPUs (S3000/S4000)
"""

import sys
import json
import os
from pathlib import Path
import time

def check_musa_available():
    """Check if MUSA GPU is available"""
    try:
        import torch_musa
        if torch_musa.is_available():
            device_count = torch_musa.device_count()
            return True, device_count
    except ImportError:
        return False, 0
    return False, 0

def init_mooer_model(model_path=None, device='musa'):
    """
    Initialize MooER ASR model

    Args:
        model_path: Path to MooER model (e.g., 'mtspeech/MooER-MTL-80K')
        device: 'musa', 'cuda', or 'cpu'
    """
    try:
        # Import required libraries
        from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
        import torch

        # Set device
        if device == 'musa':
            import torch_musa
            # Use modern PyTorch 2.1+ API
            torch.set_default_device('musa:0')
            torch.set_default_dtype(torch.float32)
            device_str = 'musa:0'
        elif device == 'cuda':
            torch.set_default_device('cuda:0')
            torch.set_default_dtype(torch.float32)
            device_str = 'cuda:0'
        else:
            device_str = 'cpu'

        # Default model path - check local models folder first
        if model_path is None:
            local_model = Path(__file__).parent.parent.parent / 'models' / 'MooER-MTL-80K'
            if local_model.exists():
                model_path = str(local_model)
            else:
                model_path = 'mtspeech/MooER-MTL-80K'  # Fall back to HuggingFace

        # Load model and processor
        print(f"Loading MooER model: {model_path}...", file=sys.stderr)

        processor = AutoProcessor.from_pretrained(
            model_path,
            cache_dir=str(Path.home() / '.cache' / 'mooer')
        )

        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            model_path,
            cache_dir=str(Path.home() / '.cache' / 'mooer'),
            torch_dtype=torch.float16 if device != 'cpu' else torch.float32,
        )

        model.to(device_str)
        model.eval()

        print(f"MooER model loaded successfully on {device_str}", file=sys.stderr)

        return model, processor, device_str

    except Exception as e:
        raise Exception(f"Failed to initialize MooER model: {str(e)}")

def transcribe_audio(audio_path, model_path=None, language=None):
    """
    Transcribe audio using MooER ASR

    Args:
        audio_path: Path to audio file
        model_path: Path to MooER model (optional)
        language: Target language code (optional)
    """
    start_time = time.time()

    try:
        import torch
        import librosa

        # Check MUSA availability
        musa_available, device_count = check_musa_available()

        # Select device
        if musa_available:
            device = 'musa'
            print(f"Using MUSA GPU ({device_count} devices)", file=sys.stderr)
        else:
            try:
                if torch.cuda.is_available():
                    device = 'cuda'
                    print("Using CUDA GPU", file=sys.stderr)
                else:
                    device = 'cpu'
                    print("Using CPU", file=sys.stderr)
            except:
                device = 'cpu'
                print("Using CPU", file=sys.stderr)

        # Initialize model
        model, processor, device_str = init_mooer_model(model_path, device)

        # Load audio
        print(f"Loading audio: {audio_path}...", file=sys.stderr)
        audio_array, sampling_rate = librosa.load(audio_path, sr=16000)

        # Process audio
        inputs = processor(
            audio_array,
            sampling_rate=sampling_rate,
            return_tensors="pt"
        )

        # Move inputs to device
        inputs = {k: v.to(device_str) for k, v in inputs.items()}

        # Generate transcription
        print("Transcribing...", file=sys.stderr)
        with torch.no_grad():
            if language:
                # Generate with forced language
                generated_ids = model.generate(
                    **inputs,
                    language=language,
                    max_new_tokens=512
                )
            else:
                # Auto-detect language
                generated_ids = model.generate(
                    **inputs,
                    max_new_tokens=512
                )

        # Decode transcription
        transcription = processor.batch_decode(
            generated_ids,
            skip_special_tokens=True
        )[0]

        processing_time = time.time() - start_time

        # Get audio duration
        duration = len(audio_array) / sampling_rate

        result = {
            'success': True,
            'text': transcription.strip(),
            'language': language if language else 'auto',
            'duration': duration,
            'device': device,
            'device_str': device_str,
            'model': model_path or 'mtspeech/MooER-MTL-80K',
            'processing_time': processing_time,
            'real_time_factor': processing_time / duration if duration > 0 else 0
        }

        print(f"Transcription complete: {len(transcription)} chars in {processing_time:.2f}s", file=sys.stderr)

        return result

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }

def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python musa_asr.py <audio_file> [model_path] [language]'
        }))
        sys.exit(1)

    audio_path = sys.argv[1]
    model_path = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != '' else None
    language = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != '' else None

    if not os.path.exists(audio_path):
        print(json.dumps({
            'success': False,
            'error': f'Audio file not found: {audio_path}'
        }))
        sys.exit(1)

    result = transcribe_audio(audio_path, model_path, language)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
