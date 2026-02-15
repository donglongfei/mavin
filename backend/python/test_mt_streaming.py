#!/usr/bin/env python3
"""
Test client for MT LiteTTS Streaming Service
"""

import asyncio
import websockets
import json
import base64
import sys
from pathlib import Path

async def test_streaming(text, output_dir="./tts_output"):
    """Test WebSocket streaming TTS"""

    # Create output directory
    Path(output_dir).mkdir(exist_ok=True)

    uri = "ws://localhost:5000/api/tts/stream"

    print(f"Connecting to {uri}...")

    try:
        async with websockets.connect(uri) as websocket:
            print(f"✓ Connected")
            print(f"Sending text: {text}\n")

            # Send request
            await websocket.send(json.dumps({
                "text": text,
                "chunk_size": 30
            }))

            chunk_files = []

            # Receive chunks
            async for message in websocket:
                data = json.loads(message)

                if data['type'] == 'start':
                    print(f"🎤 Starting synthesis: {data['text']}")
                    print("-" * 60)

                elif data['type'] == 'chunk':
                    chunk_idx = data['chunk_index']
                    total = data['total_chunks']
                    chunk_text = data['text']

                    print(f"📦 Chunk {chunk_idx + 1}/{total}: {chunk_text}")

                    # Decode and save audio
                    audio_bytes = base64.b64decode(data['audio_base64'])
                    chunk_file = Path(output_dir) / f"chunk_{chunk_idx:03d}.wav"

                    with open(chunk_file, 'wb') as f:
                        f.write(audio_bytes)

                    chunk_files.append(str(chunk_file))
                    print(f"   ✓ Saved: {chunk_file} ({len(audio_bytes)} bytes)")

                elif data['type'] == 'complete':
                    print("-" * 60)
                    print(f"✅ Complete! Generated {len(chunk_files)} chunks")
                    print(f"\nOutput files:")
                    for f in chunk_files:
                        print(f"  - {f}")
                    break

                elif data['type'] == 'error':
                    print(f"❌ Error: {data['error']}")
                    break

            return chunk_files

    except Exception as e:
        print(f"❌ Connection error: {e}")
        print("\nMake sure the server is running:")
        print("  python3 mt_litetts_ws_server.py")
        sys.exit(1)


async def test_http(text):
    """Test HTTP non-streaming synthesis"""
    import aiohttp

    url = "http://localhost:5000/api/tts/synthesize"

    print(f"\nTesting HTTP endpoint: {url}")
    print(f"Text: {text}\n")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json={"text": text}) as response:
                if response.status == 200:
                    result = await response.json()

                    if result['success']:
                        print("✅ HTTP synthesis complete")
                        print(f"   Audio path: {result['audio_path']}")
                        print(f"   File size: {result['file_size']} bytes")
                        print(f"   Text length: {result['text_length']} chars")

                        # Save audio from base64
                        audio_bytes = base64.b64decode(result['audio_base64'])
                        output_file = "http_output.wav"
                        with open(output_file, 'wb') as f:
                            f.write(audio_bytes)

                        print(f"   Saved to: {output_file}")
                    else:
                        print(f"❌ Error: {result.get('error')}")
                else:
                    print(f"❌ HTTP {response.status}")

    except Exception as e:
        print(f"❌ HTTP error: {e}")


async def main():
    """Main test function"""

    # Test text
    if len(sys.argv) > 1:
        text = sys.argv[1]
    else:
        text = "你好世界，欢迎使用MT LiteTTS流式合成服务。这是一个测试，包含多个句子。"

    print("=" * 60)
    print("MT LiteTTS Streaming Service Test")
    print("=" * 60)

    # Test WebSocket streaming
    print("\n[1] Testing WebSocket Streaming")
    print("=" * 60)
    await test_streaming(text)

    # Test HTTP
    print("\n[2] Testing HTTP Synthesis")
    print("=" * 60)
    try:
        import aiohttp
        await test_http("你好世界")
    except ImportError:
        print("⚠️  Skipping HTTP test (install aiohttp: pip install aiohttp)")

    print("\n" + "=" * 60)
    print("Testing complete!")
    print("=" * 60)


if __name__ == '__main__':
    # Install requirements if needed
    try:
        import websockets
    except ImportError:
        print("Installing websockets...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "websockets"])
        import websockets

    asyncio.run(main())
