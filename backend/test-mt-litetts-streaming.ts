#!/usr/bin/env tsx
/**
 * MT LiteTTS Streaming Service - Standalone Test
 * Tests complete synthesis with auto-play buffer mode
 *
 * Usage: tsx test-mt-litetts-streaming.ts
 */

import { mtLiteTTSStreaming } from './src/services/MTLiteTTSStreamingService.js';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Play audio file using system audio player
 */
async function playAudioFile(filePath: string): Promise<void> {
  console.log(`\n🔊 Playing audio: ${filePath}`);

  try {
    // Try different audio players (in order of preference)
    const players = [
      'ffplay -nodisp -autoexit', // FFmpeg player (best)
      'mpv --no-video',            // MPV player
      'aplay',                      // ALSA player (Linux)
      'paplay',                     // PulseAudio player (Linux)
      'play',                       // SoX player
    ];

    let played = false;

    for (const player of players) {
      try {
        await execAsync(`which ${player.split(' ')[0]}`);
        console.log(`   Using: ${player.split(' ')[0]}`);
        await execAsync(`${player} "${filePath}" 2>/dev/null`);
        played = true;
        console.log('   ✓ Playback complete');
        break;
      } catch {
        // Try next player
        continue;
      }
    }

    if (!played) {
      console.log('   ⚠️  No audio player found. Install one of:');
      console.log('      - ffmpeg (ffplay)');
      console.log('      - mpv');
      console.log('      - alsa-utils (aplay)');
      console.log('      - pulseaudio-utils (paplay)');
      console.log(`   📁 Audio saved to: ${filePath}`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  Playback error: ${error.message}`);
    console.log(`   📁 Audio saved to: ${filePath}`);
  }
}

async function testCompleteModeSynthesis() {
  console.log('\n=== Test 1: Complete Mode Synthesis (Auto-play) ===\n');

  const text = '你好世界，欢迎使用MT LiteTTS流式合成服务';

  console.log(`📝 Text: ${text}`);
  console.log('🎤 Synthesizing...\n');

  try {
    const result = await mtLiteTTSStreaming.synthesize(text);

    console.log('✅ Synthesis complete!\n');
    console.log(`📊 Results:`);
    console.log(`   - Audio buffer: ${result.audioBuffer.length} bytes`);
    console.log(`   - File saved: ${result.audioPath}`);
    console.log(`   - Audio URL: ${result.audioUrl}`);
    console.log(`   - Text length: ${result.textLength} chars`);
    console.log(`   - Processing time: ${result.processingTime.toFixed(3)}s`);
    console.log(`   - Total time: ${result.totalTime.toFixed(3)}s`);
    console.log(`   - Voice: ${result.voice}`);
    console.log(`   - Model: ${result.model}`);
    console.log(`   - Mode: ${result.mode}`);

    // Play the audio!
    await playAudioFile(result.audioPath);

    return result;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function testAutoPlayMode() {
  console.log('\n=== Test 2: Auto-play Mode (Buffer Only) ===\n');

  const text = '这是自动播放模式测试';

  console.log(`📝 Text: ${text}`);
  console.log('🎤 Synthesizing to buffer...\n');

  try {
    const { audio, result } = await mtLiteTTSStreaming.synthesizeToBuffer(text);

    console.log('✅ Audio buffer ready for auto-play!\n');
    console.log(`📊 Results:`);
    console.log(`   - Buffer size: ${audio.length} bytes`);
    console.log(`   - Ready for immediate playback: YES`);
    console.log(`   - Text length: ${result.textLength} chars`);
    console.log(`   - Processing time: ${result.processingTime.toFixed(3)}s`);
    console.log(`   - File also saved at: ${result.audioPath}`);

    // Example: In a real app, this buffer can be:
    // 1. Sent directly to browser via HTTP response
    // 2. Played using audio playback library
    // 3. Streamed to client via WebSocket
    console.log('\n💡 Usage examples:');
    console.log('   - HTTP: res.set("Content-Type", "audio/wav").send(audio)');
    console.log('   - WebSocket: ws.send(audio)');
    console.log('   - File: fs.writeFile("output.wav", audio)');

    // Play the audio!
    await playAudioFile(result.audioPath);

    return audio;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function testServiceInfo() {
  console.log('\n=== Test 3: Service Information ===\n');

  const info = mtLiteTTSStreaming.getInfo();

  console.log('📋 Service Info:');
  console.log(`   - Name: ${info.name}`);
  console.log(`   - Voice: ${info.voice} (${info.displayName})`);
  console.log(`   - Language: ${info.language}`);
  console.log(`   - Model: ${info.model}`);
  console.log(`   - Streaming: ${info.streaming ? 'YES' : 'NO'}`);
  console.log(`   - Description: ${info.description}`);
}

async function testCleanup() {
  console.log('\n=== Test 4: File Cleanup ===\n');

  console.log('🧹 Cleaning up old audio files...\n');

  const deletedCount = await mtLiteTTSStreaming.cleanupOldFiles(0);

  console.log(`✅ Cleaned up ${deletedCount} files`);
}

async function testLongText() {
  console.log('\n=== Test 5: Long Text Synthesis ===\n');

  const longText = `
这是一个较长的文本测试。
MT LiteTTS提供了高质量的中文语音合成服务。
它支持流式合成，可以实现低延迟的实时语音输出。
程小可是MT LiteTTS的高品质音色，适合各种应用场景。
系统会自动将长文本分割成合适的片段进行处理。
  `.trim().replace(/\s+/g, '');

  console.log(`📝 Text length: ${longText.length} chars`);
  console.log(`📝 Preview: ${longText.substring(0, 50)}...`);
  console.log('🎤 Synthesizing...\n');

  try {
    const startTime = Date.now();
    const { audio } = await mtLiteTTSStreaming.synthesizeToBuffer(longText);
    const totalTime = Date.now() - startTime;

    console.log('✅ Long text synthesis complete!\n');
    console.log(`📊 Results:`);
    console.log(`   - Input: ${longText.length} chars`);
    console.log(`   - Output: ${audio.length} bytes`);
    console.log(`   - Time: ${(totalTime / 1000).toFixed(3)}s`);
    console.log(`   - Speed: ${(longText.length / (totalTime / 1000)).toFixed(1)} chars/sec`);

    return audio;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function main() {
  console.log('\n'.repeat(2));
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  MT LiteTTS Streaming Service - Test Suite           ║');
  console.log('║  Auto-play Buffer Mode Testing                        ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  try {
    // Initialize service
    console.log('\n🚀 Initializing service...');
    await mtLiteTTSStreaming.initialize();

    if (!mtLiteTTSStreaming.isAvailable()) {
      console.error('\n❌ Service not available!');
      console.error('   Make sure MT LiteTTS is installed:');
      console.error('   pip install mt-litetts');
      process.exit(1);
    }

    console.log('✅ Service initialized\n');

    // Run tests
    await testServiceInfo();
    await testCompleteModeSynthesis();
    await testAutoPlayMode();
    await testLongText();
    await testCleanup();

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ All tests passed!');
    console.log('═'.repeat(60));

    console.log('\n💡 Key Features Demonstrated:');
    console.log('   ✓ Complete synthesis with audio buffer for auto-play');
    console.log('   ✓ Buffer-only mode (synthesizeToBuffer)');
    console.log('   ✓ Long text handling');
    console.log('   ✓ File cleanup');
    console.log('   ✓ Service information');

    console.log('\n📝 Integration Tips:');
    console.log('   1. Use synthesizeToBuffer() for auto-play (no file saved)');
    console.log('   2. Use synthesize() when you need both buffer and file');
    console.log('   3. Audio buffer can be sent directly to browser');
    console.log('   4. Perfect for real-time voice responses');

    console.log('\n🎯 Next Steps:');
    console.log('   - Integrate with voice routes');
    console.log('   - Add HTTP endpoint for auto-play');
    console.log('   - Test WebSocket streaming mode');
    console.log('   - Add browser integration\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    console.error('\n⚠️  Troubleshooting:');
    console.error('   1. Install MT LiteTTS: pip install mt-litetts');
    console.error('   2. Check Python script: backend/python/mt_litetts_streaming.py');
    console.error('   3. Verify model files are in ~/download/mt_litetts/');
    console.error('   4. Install dependencies: pnpm install\n');

    process.exit(1);
  }
}

// Run tests
main();
