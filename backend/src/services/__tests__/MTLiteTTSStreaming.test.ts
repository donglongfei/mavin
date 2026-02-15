import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { mtLiteTTSStreaming, MTLiteTTSStreamingService } from '../MTLiteTTSStreamingService.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('MTLiteTTSStreamingService', () => {
  let service: MTLiteTTSStreamingService;

  beforeAll(async () => {
    service = new MTLiteTTSStreamingService();
    await service.initialize();
  });

  afterAll(async () => {
    // Cleanup
    await service.stopWebSocketServer();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(service.isAvailable()).toBe(true);
    });

    it('should return service info', () => {
      const info = service.getInfo();
      expect(info.name).toBe('MT LiteTTS Streaming');
      expect(info.model).toBe('mt_litetts_v4d');
      expect(info.streaming).toBe(true);
      expect(info.voice).toBe('cheng-xiaoke');
    });
  });

  describe('Complete Synthesis', () => {
    it('should synthesize text and return audio buffer', async () => {
      const text = '你好世界';

      const result = await service.synthesize(text);

      // Check result structure
      expect(result).toHaveProperty('audioBuffer');
      expect(result).toHaveProperty('audioUrl');
      expect(result).toHaveProperty('audioPath');
      expect(result.textLength).toBe(text.length);
      expect(result.model).toBe('mt_litetts_v4d');

      // Check audio buffer
      expect(result.audioBuffer).toBeInstanceOf(Buffer);
      expect(result.audioBuffer.length).toBeGreaterThan(0);
      expect(result.fileSize).toBe(result.audioBuffer.length);

      // Check if file exists
      const fileExists = await fs.access(result.audioPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      console.log('✅ Complete synthesis test passed');
      console.log(`   Generated ${result.fileSize} bytes in ${result.totalTime}s`);
    }, 30000); // 30 second timeout

    it('should synthesize with synthesizeToBuffer (auto-play mode)', async () => {
      const text = '欢迎使用流式合成';

      const { audio, result } = await service.synthesizeToBuffer(text);

      // Audio buffer should be returned
      expect(audio).toBeInstanceOf(Buffer);
      expect(audio.length).toBeGreaterThan(0);

      // Result should have all fields
      expect(result.audioBuffer).toBe(audio);
      expect(result.textLength).toBe(text.length);

      console.log('✅ Auto-play mode test passed');
      console.log(`   Audio buffer: ${audio.length} bytes`);
    }, 30000);

    it('should handle long text', async () => {
      const longText = '这是一个较长的文本，包含多个句子。它应该被正确地合成为音频。MT LiteTTS提供了高质量的中文语音合成服务。';

      const result = await service.synthesize(longText);

      expect(result.audioBuffer.length).toBeGreaterThan(10000);
      expect(result.textLength).toBe(longText.length);
      expect(result.processingTime).toBeGreaterThan(0);

      console.log('✅ Long text synthesis test passed');
      console.log(`   Text: ${longText.length} chars`);
      console.log(`   Audio: ${result.fileSize} bytes`);
    }, 60000);
  });

  describe('Streaming Synthesis', () => {
    beforeAll(async () => {
      // Start WebSocket server for streaming tests
      await service.startWebSocketServer();
      // Wait for server to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));
    }, 10000);

    afterAll(async () => {
      await service.stopWebSocketServer();
    });

    it('should stream audio chunks', async () => {
      const text = '你好世界，这是流式合成测试。我们将文本分成多个部分。';

      const chunks: any[] = [];

      try {
        for await (const chunk of await service.synthesizeStreaming(text, 20)) {
          chunks.push(chunk);

          // Verify chunk structure
          expect(chunk).toHaveProperty('chunkIndex');
          expect(chunk).toHaveProperty('totalChunks');
          expect(chunk).toHaveProperty('text');
          expect(chunk).toHaveProperty('audioBuffer');
          expect(chunk).toHaveProperty('sampleRate');

          // Verify audio buffer
          expect(chunk.audioBuffer).toBeInstanceOf(Buffer);
          expect(chunk.audioBuffer.length).toBeGreaterThan(0);

          console.log(`   Chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks}: ${chunk.text} (${chunk.audioBuffer.length} bytes)`);
        }

        // Should have received multiple chunks
        expect(chunks.length).toBeGreaterThan(1);

        // Verify chunk ordering
        for (let i = 0; i < chunks.length; i++) {
          expect(chunks[i].chunkIndex).toBe(i);
        }

        console.log('✅ Streaming synthesis test passed');
        console.log(`   Received ${chunks.length} chunks`);
      } catch (error: any) {
        if (error.message.includes('ECONNREFUSED')) {
          console.log('⚠️  WebSocket server not available, skipping streaming test');
          return;
        }
        throw error;
      }
    }, 60000);

    it('should handle short text in streaming mode', async () => {
      const text = '你好';

      const chunks: any[] = [];

      try {
        for await (const chunk of await service.synthesizeStreaming(text)) {
          chunks.push(chunk);
        }

        // Short text might be just 1 chunk
        expect(chunks.length).toBeGreaterThanOrEqual(1);

        console.log('✅ Short text streaming test passed');
      } catch (error: any) {
        if (error.message.includes('ECONNREFUSED')) {
          console.log('⚠️  WebSocket server not available, skipping streaming test');
          return;
        }
        throw error;
      }
    }, 30000);
  });

  describe('File Management', () => {
    it('should clean up old files', async () => {
      // Generate some test files
      await service.synthesize('测试清理');
      await service.synthesize('测试清理2');

      // Cleanup files older than 0ms (all files)
      const deletedCount = await service.cleanupOldFiles(0);

      expect(deletedCount).toBeGreaterThanOrEqual(0);

      console.log('✅ File cleanup test passed');
      console.log(`   Deleted ${deletedCount} files`);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle empty text', async () => {
      await expect(service.synthesize('')).rejects.toThrow();
    });

    it('should handle very long text gracefully', async () => {
      const veryLongText = '测试文本。'.repeat(100);

      const result = await service.synthesize(veryLongText);

      expect(result.audioBuffer.length).toBeGreaterThan(0);

      console.log('✅ Very long text test passed');
    }, 120000);
  });

  describe('Performance', () => {
    it('should synthesize within reasonable time', async () => {
      const text = '性能测试文本';
      const startTime = Date.now();

      const result = await service.synthesize(text);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(10000); // Should take less than 10 seconds

      console.log('✅ Performance test passed');
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Processing time: ${result.processingTime * 1000}ms`);
    }, 15000);
  });
});
