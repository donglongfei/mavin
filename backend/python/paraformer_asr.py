#!/usr/bin/env python3
"""
Paraformer ASR Service with MUSA GPU Support
Lightweight and fast speech recognition using FunASR
Supports Chinese and English
"""

import sys
import json
import os
import time
import warnings

# Suppress all warnings and logs
warnings.filterwarnings('ignore')
os.environ['PYTHONWARNINGS'] = 'ignore'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Redirect all prints to stderr except final JSON output
import builtins
original_print = builtins.print
def stderr_print(*args, **kwargs):
    kwargs['file'] = sys.stderr
    original_print(*args, **kwargs)
builtins.print = stderr_print

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

def transcribe_audio(audio_path, language=None):
    """
    Transcribe audio using Paraformer ASR with MUSA GPU

    Args:
        audio_path: Path to audio file
        language: Target language code (optional, 'zh' or 'en')
    """
    start_time = time.time()

    try:
        from funasr import AutoModel
        import torch

        # Check MUSA availability
        musa_available, device_count = check_musa_available()

        # Select device
        if musa_available:
            device = 'musa'
            print(f"Using MUSA GPU ({device_count} devices)", file=sys.stderr)
        else:
            if torch.cuda.is_available():
                device = 'cuda'
                print("Using CUDA GPU", file=sys.stderr)
            else:
                device = 'cpu'
                print("Using CPU", file=sys.stderr)

        # Initialize Paraformer model (lightweight, fast)
        print(f"Loading Paraformer ASR model...", file=sys.stderr)

        # Use Paraformer-large for best accuracy
        model = AutoModel(
            model="iic/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-pytorch",
            device=device,
            disable_pbar=True,
            disable_log=True
        )

        print(f"Model loaded on {device}", file=sys.stderr)

        # Transcribe audio
        print(f"Transcribing: {audio_path}...", file=sys.stderr)

        # Run inference
        result = model.generate(
            input=audio_path,
            batch_size_s=300,
            disable_pbar=True
        )

        processing_time = time.time() - start_time

        # Extract transcription from result
        if result and len(result) > 0:
            text_result = result[0].get('text', '')

            # Clean up text
            transcription = text_result.strip()

            output = {
                'success': True,
                'text': transcription,
                'language': language if language else 'auto',
                'device': device,
                'model': 'Paraformer-large',
                'processing_time': processing_time
            }

            print(f"Transcription complete: {len(transcription)} chars in {processing_time:.2f}s", file=sys.stderr)

            return output
        else:
            return {
                'success': False,
                'error': 'No transcription result returned'
            }

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR: {error_details}", file=sys.stderr)

        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }

def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        original_print(json.dumps({
            'success': False,
            'error': 'Usage: python paraformer_asr.py <audio_file> [language]'
        }))
        sys.exit(1)

    audio_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != '' else None

    if not os.path.exists(audio_path):
        original_print(json.dumps({
            'success': False,
            'error': f'Audio file not found: {audio_path}'
        }))
        sys.exit(1)

    result = transcribe_audio(audio_path, language)
    original_print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
