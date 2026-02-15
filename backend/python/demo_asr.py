#!/usr/bin/env python3
"""
Simple Demo ASR for testing voice conversation flow
Returns mock transcription to test the full pipeline
"""

import sys
import json
import os
import time

def demo_transcribe(audio_path):
    """Demo transcription - returns a fixed message"""
    start_time = time.time()

    try:
        # Check if audio file exists
        if not os.path.exists(audio_path):
            return {
                'success': False,
                'error': f'Audio file not found: {audio_path}'
            }

        # Get file size
        file_size = os.path.getsize(audio_path)

        # Simulate processing time (proportional to file size)
        time.sleep(min(file_size / 50000, 2.0))  # Max 2 seconds

        processing_time = time.time() - start_time

        # Return demo transcription
        result = {
            'success': True,
            'text': '你好，这是一个测试语音识别。',  # "Hello, this is a test speech recognition."
            'language': 'zh',
            'device': 'cpu',
            'processing_time': processing_time,
            'mode': 'demo',
            'note': 'This is a demo transcription. Install MooER for real ASR.'
        }

        return result

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python demo_asr.py <audio_file>'
        }))
        sys.exit(1)

    audio_path = sys.argv[1]
    result = demo_transcribe(audio_path)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
