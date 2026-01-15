import { Test, TestingModule } from '@nestjs/testing';
import { ParserService } from './parser.service';
import { PostDetailDto } from '../dto/post-detail.dto';

describe('ParserService', () => {
  let service: ParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParserService],
    }).compile();

    service = module.get<ParserService>(ParserService);
  });

  describe('parsePostDetail', () => {
    it('应该成功解析帖子详情HTML', () => {
      const mockHtml = `
        <html>
          <head>
            <title>测试帖子标题 - 小红书</title>
          </head>
          <body>
            <div class="like-count" data-count="1234">点赞</div>
            <div class="collect-count" data-count="567">收藏</div>
            <div class="comment-count" data-count="89">评论</div>
            <div class="share-count" data-count="45">分享</div>
          </body>
        </html>
      `;

      const postId = '65a1b2c3d4e5f6789';
      const result = service.parsePostDetail(postId, mockHtml);

      expect(result).toBeDefined();
      expect(result.postId).toBe(postId);
      expect(result.title).toContain('测试帖子标题');
      expect(result.likeCount).toBe(1234);
      expect(result.collectCount).toBe(567);
      expect(result.commentCount).toBe(89);
      expect(result.shareCount).toBe(45);
      expect(result.crawlTime).toBeInstanceOf(Date);
    });

    it('应该处理包含JSON数据的页面', () => {
      const mockHtml = `
        <html>
          <body>
            <script>
              window.__INITIAL_STATE__ = {
                "note": {
                  "noteId": "test123",
                  "title": "JSON数据标题",
                  "interactInfo": {
                    "likedCount": "5678",
                    "collectedCount": "234",
                    "commentCount": "56",
                    "shareCount": "78"
                  }
                }
              };
            </script>
          </body>
        </html>
      `;

      const postId = 'test123';
      const result = service.parsePostDetail(postId, mockHtml);

      expect(result).toBeDefined();
      expect(result.postId).toBe(postId);
      expect(result.title).toBe('JSON数据标题');
      expect(result.likeCount).toBe(5678);
      expect(result.collectCount).toBe(234);
      expect(result.commentCount).toBe(56);
      expect(result.shareCount).toBe(78);
    });

    it('应该处理缺失部分数据的情况', () => {
      const mockHtml = `
        <html>
          <head><title>部分数据</title></head>
          <body>
            <div class="like-count" data-count="100">点赞</div>
          </body>
        </html>
      `;

      const postId = 'partial-data';
      const result = service.parsePostDetail(postId, mockHtml);

      expect(result).toBeDefined();
      expect(result.postId).toBe(postId);
      expect(result.likeCount).toBeGreaterThanOrEqual(0);
      expect(result.collectCount).toBeGreaterThanOrEqual(0);
      expect(result.commentCount).toBeGreaterThanOrEqual(0);
      expect(result.shareCount).toBeGreaterThanOrEqual(0);
    });

    it('应该处理完全空的HTML', () => {
      const mockHtml = '<html><body></body></html>';
      const postId = 'empty-html';

      const result = service.parsePostDetail(postId, mockHtml);

      expect(result).toBeDefined();
      expect(result.postId).toBe(postId);
      expect(result.likeCount).toBe(0);
      expect(result.collectCount).toBe(0);
      expect(result.commentCount).toBe(0);
      expect(result.shareCount).toBe(0);
    });

    it('应该处理数字字符串（带逗号）', () => {
      const mockHtml = `
        <html>
          <body>
            <script>
              window.__INITIAL_STATE__ = {
                "note": {
                  "noteId": "test456",
                  "title": "大数字测试",
                  "interactInfo": {
                    "likedCount": "12,345",
                    "collectedCount": "6,789",
                    "commentCount": "1,234",
                    "shareCount": "567"
                  }
                }
              };
            </script>
          </body>
        </html>
      `;

      const postId = 'test456';
      const result = service.parsePostDetail(postId, mockHtml);

      expect(result).toBeDefined();
      expect(result.likeCount).toBe(12345);
      expect(result.collectCount).toBe(6789);
      expect(result.commentCount).toBe(1234);
      expect(result.shareCount).toBe(567);
    });

    it('应该处理无效的JSON数据', () => {
      const mockHtml = `
        <html>
          <body>
            <script>
              window.__INITIAL_STATE__ = { invalid json
            </script>
          </body>
        </html>
      `;

      const postId = 'invalid-json';

      // 应该降级到DOM解析或返回默认值
      expect(() => service.parsePostDetail(postId, mockHtml)).not.toThrow();
      
      const result = service.parsePostDetail(postId, mockHtml);
      expect(result).toBeDefined();
      expect(result.postId).toBe(postId);
    });
  });

  describe('extractNumber', () => {
    it('应该提取纯数字', () => {
      expect(service.extractNumber('1234')).toBe(1234);
    });

    it('应该移除逗号后提取数字', () => {
      expect(service.extractNumber('12,345')).toBe(12345);
    });

    it('应该处理空字符串', () => {
      expect(service.extractNumber('')).toBe(0);
    });

    it('应该处理null/undefined', () => {
      expect(service.extractNumber(null)).toBe(0);
      expect(service.extractNumber(undefined)).toBe(0);
    });

    it('应该处理非数字字符串', () => {
      expect(service.extractNumber('abc')).toBe(0);
    });
  });
});
