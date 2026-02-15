#!/usr/bin/env python3
"""
Local TTS Service using Piper TTS
Fast, lightweight TTS that works on CPU efficiently
"""

import sys
import json
import os
from pathlib import Path
import time
import subprocess
import tempfile

def check_piper_installed():
    """Check if piper is installed"""
    try:
        result = subprocess.run(
            ['piper', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except:
        return False

def download_voice_model(voice_name='en_US-lessac-medium'):
    """Download piper voice model if not exists"""
    models_dir = Path.home() / '.local' / 'share' / 'piper' / 'voices'
    models_dir.mkdir(parents=True, exist_ok=True)

    model_file = models_dir / f'{voice_name}.onnx'
    config_file = models_dir / f'{voice_name}.onnx.json'

    if model_file.exists() and config_file.exists():
        return str(model_file), str(config_file)

    # Download model
    base_url = 'https://huggingface.co/rhasspy/piper-voices/resolve/main'
    voice_path = voice_name.replace('-', '/')

    try:
        import urllib.request

        # Download model
        model_url = f'{base_url}/{voice_path}.onnx'
        print(f'Downloading model from {model_url}...', file=sys.stderr)
        urllib.request.urlretrieve(model_url, model_file)

        # Download config
        config_url = f'{base_url}/{voice_path}.onnx.json'
        print(f'Downloading config from {config_url}...', file=sys.stderr)
        urllib.request.urlretrieve(config_url, config_file)

        return str(model_file), str(config_file)

    except Exception as e:
        raise Exception(f"Failed to download voice model: {str(e)}")

def synthesize_speech(text, output_path=None, voice='en_US-lessac-medium', speed=1.0):
    """Synthesize speech from text"""
    start_time = time.time()

    try:
        # Check if piper is installed
        if not check_piper_installed():
            # Try using piper-tts Python package instead
            return synthesize_with_python(text, output_path, voice, speed)

        # Ensure voice model is downloaded
        model_file, config_file = download_voice_model(voice)

        # Create output file if not specified
        if output_path is None:
            output_path = tempfile.mktemp(suffix='.wav')

        # Run piper
        cmd = [
            'piper',
            '--model', model_file,
            '--config', config_file,
            '--output_file', output_path,
        ]

        if speed != 1.0:
            cmd.extend(['--length_scale', str(1.0 / speed)])

        # Pipe text to piper
        result = subprocess.run(
            cmd,
            input=text,
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            raise Exception(f"Piper failed: {result.stderr}")

        processing_time = time.time() - start_time

        # Get file size
        file_size = os.path.getsize(output_path)

        return {
            'success': True,
            'audio_path': output_path,
            'file_size': file_size,
            'text_length': len(text),
            'voice': voice,
            'speed': speed,
            'processing_time': processing_time,
            'method': 'piper-cli'
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'method': 'piper-cli'
        }

def synthesize_with_python(text, output_path=None, voice='en_US-lessac-medium', speed=1.0):
    """Fallback: Use piper-tts Python package"""
    start_time = time.time()

    try:
        from piper import PiperVoice

        # Create output file if not specified
        if output_path is None:
            output_path = tempfile.mktemp(suffix='.wav')

        # Ensure voice model is downloaded
        model_file, config_file = download_voice_model(voice)

        # Initialize voice
        voice_model = PiperVoice.load(model_file, config_file)

        # Synthesize
        with open(output_path, 'wb') as f:
            voice_model.synthesize(text, f, length_scale=1.0 / speed)

        processing_time = time.time() - start_time
        file_size = os.path.getsize(output_path)

        return {
            'success': True,
            'audio_path': output_path,
            'file_size': file_size,
            'text_length': len(text),
            'voice': voice,
            'speed': speed,
            'processing_time': processing_time,
            'method': 'piper-python'
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'method': 'piper-python'
        }

def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python local_tts.py <text> [output_path] [voice] [speed]'
        }))
        sys.exit(1)

    text = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    voice = sys.argv[3] if len(sys.argv) > 3 else 'en_US-lessac-medium'
    speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0

    result = synthesize_speech(text, output_path, voice, speed)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
