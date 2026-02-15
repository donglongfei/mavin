#!/usr/bin/env python3
"""
Moore Threads LiteTTS Service with MUSA GPU Support
Official on-device TTS from Moore Threads
Model: mt_litetts_v4d (程小可 voice)
Optimized for MUSA GPU with CPU fallback
"""

import sys
import json
import os
from pathlib import Path
import time
import tempfile

# MT LiteTTS path
MT_LITETTS_PATH = Path.home() / '.local' / 'share' / 'mt_litetts'
INFERENCE_SCRIPT = MT_LITETTS_PATH / 'inference_zh.py'
MODEL_PATH = MT_LITETTS_PATH / 'serving_models' / 'litetts_v4d'

def check_device():
    """Check available compute device (MUSA > CUDA > CPU)"""
    devices = []
    device_info = {}

    # Check for MUSA
    try:
        import torch_musa
        if torch_musa.is_available():
            devices.append('musa')
            device_info['musa'] = {
                'available': True,
                'device_count': torch_musa.device_count(),
                'device_name': 'Moore Threads MUSA GPU'
            }
            print(f"MUSA GPU available: {torch_musa.device_count()} device(s)", file=sys.stderr)
    except ImportError:
        device_info['musa'] = {'available': False, 'error': 'torch_musa not installed'}
    except Exception as e:
        device_info['musa'] = {'available': False, 'error': str(e)}

    # Check for CUDA
    try:
        import torch
        if torch.cuda.is_available():
            devices.append('cuda')
            device_info['cuda'] = {
                'available': True,
                'device_count': torch.cuda.device_count(),
                'device_name': torch.cuda.get_device_name(0)
            }
            print(f"CUDA GPU available: {torch.cuda.device_count()} device(s)", file=sys.stderr)
    except:
        device_info['cuda'] = {'available': False}

    # CPU always available
    devices.append('cpu')
    device_info['cpu'] = {'available': True}

    return devices, device_info

def check_mt_litetts_installed():
    """Check if MT LiteTTS is installed"""
    return INFERENCE_SCRIPT.exists() and MODEL_PATH.exists()

def download_mt_litetts():
    """Download and install MT LiteTTS"""
    import urllib.request
    import tarfile
    import subprocess

    print("=" * 60, file=sys.stderr)
    print("Downloading MT LiteTTS model package...", file=sys.stderr)
    print("=" * 60, file=sys.stderr)

    download_url = "https://mt-vaas-web.tos-cn-beijing.volces.com/tts/litetts/mt_litetts_v4d.tar"
    tar_path = "/tmp/mt_litetts_v4d.tar"

    try:
        # Download
        print(f"Downloading from: {download_url}", file=sys.stderr)
        print("Size: ~500MB (this may take a few minutes)", file=sys.stderr)
        urllib.request.urlretrieve(download_url, tar_path)
        print(f"✓ Downloaded to: {tar_path}", file=sys.stderr)

        # Extract
        print(f"Extracting to: {MT_LITETTS_PATH.parent}...", file=sys.stderr)
        MT_LITETTS_PATH.parent.mkdir(parents=True, exist_ok=True)

        with tarfile.open(tar_path, 'r') as tar:
            tar.extractall(path=MT_LITETTS_PATH.parent)
        print(f"✓ Extracted successfully", file=sys.stderr)

        # Rename extracted folder if needed
        extracted_folder = MT_LITETTS_PATH.parent / 'mt_litetts'
        if extracted_folder != MT_LITETTS_PATH and extracted_folder.exists():
            if MT_LITETTS_PATH.exists():
                import shutil
                shutil.rmtree(MT_LITETTS_PATH)
            extracted_folder.rename(MT_LITETTS_PATH)

        # Install requirements
        requirements_path = MT_LITETTS_PATH / 'requirements.txt'
        if requirements_path.exists():
            print("Installing Python dependencies...", file=sys.stderr)
            subprocess.run(
                [sys.executable, '-m', 'pip', 'install', '-r', str(requirements_path)],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            print("✓ Dependencies installed", file=sys.stderr)

        print("=" * 60, file=sys.stderr)
        print("✓ MT LiteTTS installed successfully!", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        return True

    except Exception as e:
        print(f"✗ Error installing MT LiteTTS: {e}", file=sys.stderr)
        return False

def configure_device_for_inference(device='musa'):
    """Configure PyTorch device for MT LiteTTS inference"""
    try:
        import torch

        if device == 'musa':
            try:
                import torch_musa
                if torch_musa.is_available():
                    # Use modern PyTorch API (2.1+) for device configuration
                    torch.set_default_device('musa:0')
                    torch.set_default_dtype(torch.float32)
                    print(f"✓ Configured for MUSA GPU", file=sys.stderr)
                    return 'musa:0'
            except Exception as e:
                print(f"Warning: MUSA configuration failed: {e}", file=sys.stderr)
                device = 'cuda'  # Fall back to CUDA

        if device == 'cuda':
            if torch.cuda.is_available():
                torch.set_default_device('cuda:0')
                torch.set_default_dtype(torch.float32)
                print(f"✓ Configured for CUDA GPU", file=sys.stderr)
                return 'cuda:0'
            else:
                device = 'cpu'

        if device == 'cpu':
            print(f"✓ Configured for CPU", file=sys.stderr)
            return 'cpu'

    except Exception as e:
        print(f"Warning: Device configuration failed: {e}", file=sys.stderr)
        return 'cpu'

def synthesize_speech(text, output_path=None, device='auto'):
    """
    Synthesize speech using MT LiteTTS with MUSA GPU support

    Args:
        text: Text to synthesize (Chinese)
        output_path: Output WAV file path
        device: 'auto', 'musa', 'cuda', or 'cpu'
    """
    start_time = time.time()

    try:
        # Check installation
        if not check_mt_litetts_installed():
            print("MT LiteTTS not installed. Installing...", file=sys.stderr)
            if not download_mt_litetts():
                return {
                    'success': False,
                    'error': 'Failed to install MT LiteTTS'
                }

        # Determine device
        available_devices, device_info = check_device()

        if device == 'auto':
            device = available_devices[0]  # Use best available
            print(f"Auto-selected device: {device}", file=sys.stderr)
        elif device not in available_devices:
            print(f"Warning: {device} not available, falling back to {available_devices[0]}", file=sys.stderr)
            device = available_devices[0]

        # Configure device
        device_str = configure_device_for_inference(device)

        # Change to MT LiteTTS directory
        original_dir = os.getcwd()
        os.chdir(MT_LITETTS_PATH)

        try:
            # Create output path if not specified
            if output_path is None:
                output_path = tempfile.mktemp(suffix='.wav')

            print(f"Synthesizing: '{text}' on {device}", file=sys.stderr)

            # Run inference
            # The inference_zh.py script should automatically use the configured device
            import subprocess
            env = os.environ.copy()
            # Set environment variable for device (if inference script supports it)
            env['CUDA_VISIBLE_DEVICES'] = '0' if device != 'cpu' else ''

            result = subprocess.run(
                [sys.executable, 'inference_zh.py', text],
                cwd=MT_LITETTS_PATH,
                capture_output=True,
                text=True,
                timeout=60,
                env=env
            )

            if result.returncode != 0:
                raise Exception(f"Synthesis failed: {result.stderr}")

            # Check if audio.wav was created
            default_output = MT_LITETTS_PATH / 'audio.wav'
            if default_output.exists():
                # Move to desired location
                if output_path != str(default_output):
                    import shutil
                    shutil.move(str(default_output), output_path)
            else:
                raise Exception("Output audio file not found")

            processing_time = time.time() - start_time

            # Get file size
            file_size = os.path.getsize(output_path)

            return {
                'success': True,
                'audio_path': output_path,
                'file_size': file_size,
                'text_length': len(text),
                'voice': '程小可 (Cheng Xiaoke)',
                'model': 'mt_litetts_v4d',
                'device': device,
                'device_str': device_str,
                'device_info': device_info.get(device, {}),
                'processing_time': processing_time,
                'backend': 'mt-litetts'
            }

        finally:
            # Restore original directory
            os.chdir(original_dir)

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__,
            'device_attempted': device
        }

def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python mt_litetts.py <text> [output_path] [device]',
            'note': 'MT LiteTTS - Moore Threads Official TTS with MUSA GPU Support',
            'device_options': 'auto (default), musa, cuda, cpu'
        }, ensure_ascii=False))
        sys.exit(1)

    text = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != '' else None
    device = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != '' else 'auto'

    result = synthesize_speech(text, output_path, device)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
