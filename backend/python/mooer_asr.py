#!/usr/bin/env python3
"""
MooER ASR Service using FunASR Framework
Moore Threads' LLM-based Speech Recognition Model
Optimized for MUSA GPUs (S3000/S4000)
"""

import sys
import json
import os
from pathlib import Path
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

def init_mooer_model(model_path=None, device='musa'):
    """
    Initialize MooER ASR model using FunASR

    Args:
        model_path: Path to MooER model directory
        device: 'musa', 'cuda', or 'cpu'
    """
    try:
        from funasr import AutoModel
        import torch

        # Set device
        if device == 'musa':
            try:
                import torch_musa
                # Use modern PyTorch 2.1+ API
                torch.set_default_device('musa:0')
                torch.set_default_dtype(torch.float32)
                device_str = 'musa:0'
                print(f"Using MUSA GPU", file=sys.stderr)
            except:
                device_str = 'cpu'
                device = 'cpu'
                print("MUSA not available, falling back to CPU", file=sys.stderr)
        elif device == 'cuda':
            if torch.cuda.is_available():
                torch.set_default_device('cuda:0')
                torch.set_default_dtype(torch.float32)
                device_str = 'cuda:0'
                print("Using CUDA GPU", file=sys.stderr)
            else:
                device_str = 'cpu'
                device = 'cpu'
                print("CUDA not available, falling back to CPU", file=sys.stderr)
        else:
            device_str = 'cpu'
            print("Using CPU", file=sys.stderr)

        # Default model path - use ModelScope ID
        if model_path is None:
            # Use ModelScope model ID (will download and cache automatically)
            model_path = 'iic/MooER-MTL-80K'
            print(f"Using ModelScope model: {model_path}", file=sys.stderr)

        # Load model with FunASR
        print(f"Initializing MooER model...", file=sys.stderr)
        model = AutoModel(
            model=model_path,
            device=device_str,
            disable_pbar=True,
            disable_log=True
        )

        print(f"MooER model loaded successfully on {device_str}", file=sys.stderr)

        return model, device_str

    except Exception as e:
        raise Exception(f"Failed to initialize MooER model: {str(e)}")

def transcribe_audio(audio_path, model_path=None, language=None):
    """
    Transcribe audio using MooER ASR

    Args:
        audio_path: Path to audio file
        model_path: Path to MooER model (optional)
        language: Target language code (optional, 'zh' or 'en')
    """
    start_time = time.time()

    try:
        # Check MUSA availability
        musa_available, device_count = check_musa_available()

        # Force CPU for now - MooER 7B is too large for MUSA real-time loading
        # TODO: Optimize for MUSA GPU later
        device = 'cpu'
        print(f"Using CPU for MooER (7B model is large)", file=sys.stderr)

        # Initialize model
        model, device_str = init_mooer_model(model_path, device)

        # Transcribe audio
        print(f"Transcribing: {audio_path}...", file=sys.stderr)

        # FunASR generate parameters
        generate_kwargs = {}
        if language:
            generate_kwargs['language'] = language

        # Run inference
        result = model.generate(
            input=audio_path,
            batch_size_s=300,  # Process in batches
            **generate_kwargs
        )

        processing_time = time.time() - start_time

        # Extract transcription from result
        if result and len(result) > 0:
            transcription = result[0].get('text', '')

            # Get audio duration if available
            duration = result[0].get('duration', 0)

            output = {
                'success': True,
                'text': transcription.strip(),
                'language': language if language else 'auto',
                'duration': duration,
                'device': device,
                'device_str': device_str,
                'model': model_path or 'MooER-MTL-80K',
                'processing_time': processing_time,
                'real_time_factor': processing_time / duration if duration > 0 else 0
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
            'error_type': type(e).__name__,
            'error_details': error_details
        }

def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        original_print(json.dumps({
            'success': False,
            'error': 'Usage: python mooer_asr.py <audio_file> [model_path] [language]'
        }))
        sys.exit(1)

    audio_path = sys.argv[1]
    model_path = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != '' else None
    language = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != '' else None

    if not os.path.exists(audio_path):
        original_print(json.dumps({
            'success': False,
            'error': f'Audio file not found: {audio_path}'
        }))
        sys.exit(1)

    result = transcribe_audio(audio_path, model_path, language)
    original_print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
