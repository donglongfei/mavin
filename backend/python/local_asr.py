#!/usr/bin/env python3
"""
Local ASR Service using Faster-Whisper
Supports MUSA GPU, CUDA GPU, and CPU fallback
"""

import sys
import json
import os
from pathlib import Path
import time

def check_device():
    """Check available compute device"""
    devices = []

    # Check for MUSA
    try:
        import torch_musa
        if torch_musa.is_available():
            devices.append('musa')
    except:
        pass

    # Check for CUDA
    try:
        import torch
        if torch.cuda.is_available():
            devices.append('cuda')
    except:
        pass

    # CPU always available
    devices.append('cpu')

    return devices

def init_whisper(device='cpu', model_size='base'):
    """Initialize Faster-Whisper model"""
    try:
        from faster_whisper import WhisperModel

        # Map device to compute_type
        if device in ['cuda', 'musa']:
            compute_type = 'float16'
        else:
            compute_type = 'int8'

        # For MUSA, we may need to use CPU for now as faster-whisper
        # doesn't directly support MUSA yet
        actual_device = 'cpu' if device == 'musa' else device

        model = WhisperModel(
            model_size,
            device=actual_device,
            compute_type=compute_type,
            download_root=str(Path.home() / '.cache' / 'whisper')
        )

        return model, actual_device, compute_type
    except Exception as e:
        raise Exception(f"Failed to initialize Whisper: {str(e)}")

def transcribe_audio(audio_path, model_size='base', language=None):
    """Transcribe audio file"""
    start_time = time.time()

    # Check available devices
    devices = check_device()
    preferred_device = devices[0]  # Use best available

    try:
        # Initialize model
        model, device, compute_type = init_whisper(preferred_device, model_size)

        # Transcribe
        segments, info = model.transcribe(
            audio_path,
            language=language,
            beam_size=5,
            vad_filter=True,  # Voice activity detection
            vad_parameters={
                "threshold": 0.5,
                "min_speech_duration_ms": 250,
            }
        )

        # Collect segments
        transcription = []
        full_text = []

        for segment in segments:
            transcription.append({
                'start': segment.start,
                'end': segment.end,
                'text': segment.text.strip(),
                'confidence': segment.avg_logprob
            })
            full_text.append(segment.text.strip())

        processing_time = time.time() - start_time

        result = {
            'success': True,
            'text': ' '.join(full_text),
            'segments': transcription,
            'language': info.language,
            'language_probability': info.language_probability,
            'duration': info.duration,
            'device': device,
            'compute_type': compute_type,
            'model': model_size,
            'processing_time': processing_time
        }

        return result

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'device': preferred_device
        }

def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python local_asr.py <audio_file> [model_size] [language]'
        }))
        sys.exit(1)

    audio_path = sys.argv[1]
    model_size = sys.argv[2] if len(sys.argv) > 2 else 'base'
    language = sys.argv[3] if len(sys.argv) > 3 else None

    if not os.path.exists(audio_path):
        print(json.dumps({
            'success': False,
            'error': f'Audio file not found: {audio_path}'
        }))
        sys.exit(1)

    result = transcribe_audio(audio_path, model_size, language)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
