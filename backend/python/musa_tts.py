#!/usr/bin/env python3
"""
MUSA-Optimized TTS Service
Flexible TTS service that can use multiple backends
Optimized for Moore Threads MUSA GPUs

Note: Moore Threads doesn't have a specific "lite-TTS" in public docs.
This service supports:
1. Piper TTS (fast, CPU-efficient)
2. Coqui TTS (high quality, can use GPU)
3. Edge TTS (Microsoft, online)
"""

import sys
import json
import os
from pathlib import Path
import time
import tempfile

def check_available_tts_backends():
    """Check which TTS backends are available"""
    backends = []

    # Check Piper
    try:
        import piper
        backends.append('piper')
    except:
        try:
            import subprocess
            subprocess.run(['piper', '--version'], capture_output=True, timeout=2)
            backends.append('piper-cli')
        except:
            pass

    # Check Coqui TTS
    try:
        from TTS.api import TTS
        backends.append('coqui')
    except:
        pass

    # Check Edge TTS
    try:
        import edge_tts
        backends.append('edge')
    except:
        pass

    return backends

def synthesize_piper(text, output_path, voice='en_US-lessac-medium', speed=1.0):
    """Synthesize using Piper TTS (CPU-optimized, fast)"""
    try:
        from piper import PiperVoice
        import wave

        # Model paths
        models_dir = Path.home() / '.local' / 'share' / 'piper' / 'voices'
        model_file = models_dir / f'{voice}.onnx'
        config_file = models_dir / f'{voice}.onnx.json'

        # Download if needed
        if not model_file.exists():
            # Download model
            import urllib.request
            base_url = 'https://huggingface.co/rhasspy/piper-voices/resolve/main'
            voice_parts = voice.split('-')
            lang = voice_parts[0]
            name = voice_parts[1] if len(voice_parts) > 1 else 'default'
            quality = voice_parts[2] if len(voice_parts) > 2 else 'medium'

            model_url = f'{base_url}/{lang}/{name}/{quality}/{voice}.onnx'
            config_url = f'{base_url}/{lang}/{name}/{quality}/{voice}.onnx.json'

            models_dir.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve(model_url, model_file)
            urllib.request.urlretrieve(config_url, config_file)

        # Load voice
        voice_model = PiperVoice.load(str(model_file), str(config_file))

        # Synthesize
        with wave.open(output_path, 'wb') as wav_file:
            voice_model.synthesize(text, wav_file, length_scale=1.0 / speed)

        return {
            'backend': 'piper',
            'success': True
        }

    except Exception as e:
        return {
            'backend': 'piper',
            'success': False,
            'error': str(e)
        }

def synthesize_coqui(text, output_path, voice='tts_models/en/ljspeech/tacotron2-DDC', speed=1.0):
    """Synthesize using Coqui TTS (GPU-accelerated if available)"""
    try:
        from TTS.api import TTS
        import torch

        # Check for MUSA/CUDA
        device = 'cpu'
        try:
            import torch_musa
            if torch_musa.is_available():
                device = 'musa'
        except:
            if torch.cuda.is_available():
                device = 'cuda'

        # Initialize TTS
        tts = TTS(voice).to(device)

        # Synthesize
        tts.tts_to_file(
            text=text,
            file_path=output_path,
            speed=speed
        )

        return {
            'backend': 'coqui',
            'device': device,
            'success': True
        }

    except Exception as e:
        return {
            'backend': 'coqui',
            'success': False,
            'error': str(e)
        }

def synthesize_edge(text, output_path, voice='en-US-AriaNeural', speed=1.0):
    """Synthesize using Edge TTS (online, free, fast)"""
    try:
        import edge_tts
        import asyncio

        async def _synthesize():
            rate_str = f'+{int((speed - 1) * 100)}%' if speed > 1 else f'{int((speed - 1) * 100)}%'
            communicate = edge_tts.Communicate(text, voice, rate=rate_str)
            await communicate.save(output_path)

        asyncio.run(_synthesize())

        return {
            'backend': 'edge',
            'success': True,
            'note': 'Requires internet connection'
        }

    except Exception as e:
        return {
            'backend': 'edge',
            'success': False,
            'error': str(e)
        }

def synthesize_speech(text, output_path=None, backend='auto', voice=None, speed=1.0):
    """
    Synthesize speech from text

    Args:
        text: Text to synthesize
        output_path: Output WAV file path
        backend: 'piper', 'coqui', 'edge', or 'auto'
        voice: Voice name (backend-specific)
        speed: Speech speed multiplier (0.5 - 2.0)
    """
    start_time = time.time()

    try:
        # Check available backends
        available_backends = check_available_tts_backends()

        if not available_backends:
            return {
                'success': False,
                'error': 'No TTS backend available. Install: pip install piper-tts TTS edge-tts'
            }

        # Auto-select backend
        if backend == 'auto':
            # Prefer: piper (fast) > coqui (quality) > edge (online)
            if 'piper' in available_backends or 'piper-cli' in available_backends:
                backend = 'piper'
            elif 'coqui' in available_backends:
                backend = 'coqui'
            elif 'edge' in available_backends:
                backend = 'edge'
            else:
                backend = available_backends[0]

        # Create output path if not provided
        if output_path is None:
            output_path = tempfile.mktemp(suffix='.wav')

        # Synthesize with selected backend
        if backend == 'piper':
            voice = voice or 'en_US-lessac-medium'
            result = synthesize_piper(text, output_path, voice, speed)
        elif backend == 'coqui':
            voice = voice or 'tts_models/en/ljspeech/tacotron2-DDC'
            result = synthesize_coqui(text, output_path, voice, speed)
        elif backend == 'edge':
            voice = voice or 'en-US-AriaNeural'
            result = synthesize_edge(text, output_path, voice, speed)
        else:
            return {
                'success': False,
                'error': f'Unknown backend: {backend}'
            }

        if not result['success']:
            return result

        processing_time = time.time() - start_time

        # Get file size
        file_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0

        return {
            'success': True,
            'audio_path': output_path,
            'file_size': file_size,
            'text_length': len(text),
            'backend': result['backend'],
            'device': result.get('device', 'cpu'),
            'voice': voice,
            'speed': speed,
            'processing_time': processing_time,
            'available_backends': available_backends
        }

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
            'error': 'Usage: python musa_tts.py <text> [output_path] [backend] [voice] [speed]',
            'available_backends': check_available_tts_backends()
        }))
        sys.exit(1)

    text = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != '' else None
    backend = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != '' else 'auto'
    voice = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != '' else None
    speed = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0

    result = synthesize_speech(text, output_path, backend, voice, speed)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
