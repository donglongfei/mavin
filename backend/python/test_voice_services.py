#!/usr/bin/env python3
"""
Unit Tests for MooER ASR and MT LiteTTS Services
Tests device detection, inference, and error handling
"""

import unittest
import sys
import json
import os
from pathlib import Path
import tempfile

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Import services
try:
    from musa_asr import check_device, transcribe_audio
    MUSA_ASR_AVAILABLE = True
except ImportError as e:
    print(f"Warning: musa_asr not available: {e}")
    MUSA_ASR_AVAILABLE = False

try:
    from mt_litetts import check_device as check_tts_device, synthesize_speech, check_mt_litetts_installed
    MT_LITETTS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: mt_litetts not available: {e}")
    MT_LITETTS_AVAILABLE = False


class TestDeviceDetection(unittest.TestCase):
    """Test device detection for both ASR and TTS"""

    @unittest.skipUnless(MUSA_ASR_AVAILABLE, "MooER ASR not available")
    def test_asr_device_detection(self):
        """Test ASR device detection"""
        devices = check_device()
        print(f"\nASR Available devices: {devices}")

        # CPU should always be available
        self.assertIn('cpu', devices)

        # Check for MUSA
        if 'musa' in devices:
            print("✓ MUSA GPU detected for ASR")
            self.assertTrue(True)

        # Check for CUDA
        if 'cuda' in devices:
            print("✓ CUDA GPU detected for ASR")
            self.assertTrue(True)

    @unittest.skipUnless(MT_LITETTS_AVAILABLE, "MT LiteTTS not available")
    def test_tts_device_detection(self):
        """Test TTS device detection"""
        devices, device_info = check_tts_device()
        print(f"\nTTS Available devices: {devices}")
        print(f"TTS Device info: {json.dumps(device_info, indent=2)}")

        # CPU should always be available
        self.assertIn('cpu', devices)

        # Check for MUSA
        if 'musa' in devices:
            print("✓ MUSA GPU detected for TTS")
            self.assertTrue(device_info['musa']['available'])

        # Check for CUDA
        if 'cuda' in devices:
            print("✓ CUDA GPU detected for TTS")
            self.assertTrue(device_info['cuda']['available'])


class TestMooERAR(unittest.TestCase):
    """Test MooER ASR service"""

    @unittest.skipUnless(MUSA_ASR_AVAILABLE, "MooER ASR not available")
    def test_asr_installation_check(self):
        """Test if ASR dependencies are available"""
        try:
            import transformers
            import librosa
            import torch
            print("\n✓ ASR dependencies installed:")
            print(f"  - transformers: {transformers.__version__}")
            print(f"  - torch: {torch.__version__}")
            self.assertTrue(True)
        except ImportError as e:
            self.fail(f"ASR dependencies missing: {e}")

    @unittest.skipUnless(MUSA_ASR_AVAILABLE, "MooER ASR not available")
    def test_asr_with_test_audio(self):
        """Test ASR with a test audio file"""
        # This test requires an actual audio file
        # Skip if no test audio available
        test_audio_path = Path(__file__).parent / 'test_audio.mp3'

        if not test_audio_path.exists():
            self.skipTest("Test audio file not found. Place test_audio.mp3 in python/ directory")

        print(f"\nTesting ASR with: {test_audio_path}")

        try:
            result = transcribe_audio(str(test_audio_path), model_size='base')

            self.assertTrue(result.get('success', False), f"ASR failed: {result.get('error')}")
            self.assertIn('text', result)
            self.assertIn('device', result)
            self.assertIn('processing_time', result)

            print(f"✓ ASR Result:")
            print(f"  Text: {result['text']}")
            print(f"  Device: {result['device']}")
            print(f"  Processing time: {result['processing_time']:.2f}s")
            print(f"  Language: {result.get('language', 'N/A')}")

        except Exception as e:
            self.fail(f"ASR test failed with exception: {e}")

    @unittest.skipUnless(MUSA_ASR_AVAILABLE, "MooER ASR not available")
    def test_asr_error_handling(self):
        """Test ASR error handling with invalid input"""
        # Test with non-existent file
        result = transcribe_audio('/nonexistent/audio.mp3')

        self.assertFalse(result.get('success', False))
        self.assertIn('error', result)
        print(f"\n✓ ASR error handling works: {result['error']}")


class TestMTLiteTTS(unittest.TestCase):
    """Test MT LiteTTS service"""

    @unittest.skipUnless(MT_LITETTS_AVAILABLE, "MT LiteTTS not available")
    def test_tts_installation_check(self):
        """Test if TTS is installed"""
        is_installed = check_mt_litetts_installed()
        print(f"\n MT LiteTTS installed: {is_installed}")

        if not is_installed:
            print("  Note: Will auto-download on first synthesis (~500MB)")

    @unittest.skipUnless(MT_LITETTS_AVAILABLE, "MT LiteTTS not available")
    def test_tts_synthesis_cpu(self):
        """Test TTS synthesis on CPU"""
        test_text = "你好世界"

        print(f"\nTesting TTS with text: '{test_text}' on CPU")

        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                output_path = f.name

            result = synthesize_speech(test_text, output_path, device='cpu')

            self.assertTrue(result.get('success', False), f"TTS failed: {result.get('error')}")
            self.assertIn('audio_path', result)
            self.assertIn('device', result)
            self.assertEqual(result['device'], 'cpu')
            self.assertIn('processing_time', result)

            # Check if file was created
            self.assertTrue(os.path.exists(result['audio_path']))

            print(f"✓ TTS Result:")
            print(f"  Audio path: {result['audio_path']}")
            print(f"  File size: {result['file_size']} bytes")
            print(f"  Device: {result['device']}")
            print(f"  Processing time: {result['processing_time']:.2f}s")
            print(f"  Voice: {result['voice']}")

            # Cleanup
            try:
                os.unlink(result['audio_path'])
            except:
                pass

        except Exception as e:
            self.fail(f"TTS test failed with exception: {e}")

    @unittest.skipUnless(MT_LITETTS_AVAILABLE, "MT LiteTTS not available")
    def test_tts_synthesis_gpu(self):
        """Test TTS synthesis on GPU (MUSA/CUDA)"""
        devices, device_info = check_tts_device()

        # Skip if no GPU available
        if 'musa' not in devices and 'cuda' not in devices:
            self.skipTest("No GPU available for TTS test")

        gpu_device = 'musa' if 'musa' in devices else 'cuda'
        test_text = "测试MUSA GPU加速"

        print(f"\nTesting TTS with text: '{test_text}' on {gpu_device.upper()}")

        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                output_path = f.name

            result = synthesize_speech(test_text, output_path, device=gpu_device)

            self.assertTrue(result.get('success', False), f"TTS failed: {result.get('error')}")
            self.assertIn('device', result)
            # Device may fall back to CPU if GPU initialization fails
            print(f"  Actual device used: {result['device']}")

            if result['device'] == gpu_device:
                print(f"✓ TTS successfully used {gpu_device.upper()} GPU!")
            else:
                print(f"⚠ TTS fell back to {result['device']}")

            # Cleanup
            try:
                os.unlink(result['audio_path'])
            except:
                pass

        except Exception as e:
            self.fail(f"TTS GPU test failed with exception: {e}")

    @unittest.skipUnless(MT_LITETTS_AVAILABLE, "MT LiteTTS not available")
    def test_tts_auto_device_selection(self):
        """Test TTS automatic device selection"""
        test_text = "自动设备选择"

        print(f"\nTesting TTS with auto device selection")

        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                output_path = f.name

            result = synthesize_speech(test_text, output_path, device='auto')

            self.assertTrue(result.get('success', False), f"TTS failed: {result.get('error')}")
            self.assertIn('device', result)

            print(f"✓ Auto-selected device: {result['device']}")
            print(f"  Device info: {result.get('device_info', {})}")

            # Cleanup
            try:
                os.unlink(result['audio_path'])
            except:
                pass

        except Exception as e:
            self.fail(f"TTS auto device test failed with exception: {e}")

    @unittest.skipUnless(MT_LITETTS_AVAILABLE, "MT LiteTTS not available")
    def test_tts_error_handling(self):
        """Test TTS error handling"""
        # Test with empty text
        result = synthesize_speech("", device='cpu')

        # Should either fail or handle gracefully
        print(f"\n✓ TTS empty text handling: {result.get('success', False)}")


class TestIntegration(unittest.TestCase):
    """Integration tests for combined ASR + TTS"""

    @unittest.skipUnless(MUSA_ASR_AVAILABLE and MT_LITETTS_AVAILABLE, "Both ASR and TTS required")
    def test_roundtrip_audio_text_audio(self):
        """Test roundtrip: Audio → Text → Audio"""
        # This is a complex test that requires:
        # 1. Test audio file
        # 2. Both ASR and TTS working
        # Skip if dependencies not met
        test_audio_path = Path(__file__).parent / 'test_audio.mp3'

        if not test_audio_path.exists():
            self.skipTest("Test audio file required for integration test")

        print(f"\n=== Integration Test: Audio → Text → Audio ===")

        try:
            # Step 1: Audio → Text (ASR)
            print("Step 1: Transcribing audio...")
            asr_result = transcribe_audio(str(test_audio_path), model_size='base')
            self.assertTrue(asr_result.get('success', False))

            transcribed_text = asr_result['text']
            print(f"  Transcribed: '{transcribed_text}'")

            # Step 2: Text → Audio (TTS)
            print("Step 2: Synthesizing text...")
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                output_path = f.name

            tts_result = synthesize_speech(transcribed_text, output_path)
            self.assertTrue(tts_result.get('success', False))

            print(f"  Synthesized: {tts_result['audio_path']}")
            print(f"✓ Roundtrip successful!")
            print(f"  ASR device: {asr_result['device']}")
            print(f"  TTS device: {tts_result['device']}")
            print(f"  Total time: {asr_result['processing_time'] + tts_result['processing_time']:.2f}s")

            # Cleanup
            try:
                os.unlink(output_path)
            except:
                pass

        except Exception as e:
            self.fail(f"Integration test failed: {e}")


def run_tests(verbose=True):
    """Run all tests"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestDeviceDetection))
    suite.addTests(loader.loadTestsFromTestCase(TestMooERAR))
    suite.addTests(loader.loadTestsFromTestCase(TestMTLiteTTS))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2 if verbose else 1)
    result = runner.run(suite)

    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors) - len(result.skipped)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    print("=" * 60)

    return result.wasSuccessful()


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Test MT Voice Services')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--test', '-t', help='Run specific test (e.g., TestMTLiteTTS.test_tts_synthesis_cpu)')
    args = parser.parse_args()

    if args.test:
        # Run specific test
        suite = unittest.TestLoader().loadTestsFromName(args.test, module=sys.modules[__name__])
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        sys.exit(0 if result.wasSuccessful() else 1)
    else:
        # Run all tests
        success = run_tests(verbose=args.verbose)
        sys.exit(0 if success else 1)
