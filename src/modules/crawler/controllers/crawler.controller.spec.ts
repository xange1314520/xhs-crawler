import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from '../services/crawler.service';
import { PostDetailDto } from '../dto/post-detail.dto';

describe('CrawlerController', () => {
  let controller: CrawlerController;
  let mockCrawlerService: jest.Mocked<CrawlerService>;

  beforeEach(async () => {
    mockCrawlerService = {
      crawlPost: jest.fn(),
      crawlBatch: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrawlerController],
      providers: [
        {
          provide: CrawlerService,
          useValue: mockCrawlerService,
        },
      ],
    }).compile();

    controller = module.get<CrawlerController>(CrawlerController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/posts/:postId/detail', () => {
    it('应该成功爬取帖子详情', async () => {
      const postId = 'test-post-id';
      const xsecToken = 'test-token';

      const mockPostDetail: PostDetailDto = {
        postId,
        title: '测试帖子',
        likeCount: 100,
        collectCount: 50,
        commentCount: 20,
        shareCount: 10,
        crawlTime: new Date(),
      };

      mockCrawlerService.crawlPost.mockResolvedValue(mockPostDetail);

      const result = await controller.crawlPost(postId, xsecToken);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockPostDetail);
      expect(mockCrawlerService.crawlPost).toHaveBeenCalledWith(postId, xsecToken);
    });

    it('应该返回带时间戳的响应', async () => {
      const postId = 'test-post-id';
      const xsecToken = 'test-token';

      const mockPostDetail: PostDetailDto = {
        postId,
        title: '测试',
        likeCount: 0,
        collectCount: 0,
        commentCount: 0,
        shareCount: 0,
        crawlTime: new Date(),
      };

      mockCrawlerService.crawlPost.mockResolvedValue(mockPostDetail);

      const result = await controller.crawlPost(postId, xsecToken);

      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });
  });

  describe('POST /api/posts/batch', () => {
    it('应该成功批量爬取帖子', async () => {
      const dto = {
        posts: [
          { postId: 'post-1', xsecToken: 'token-1' },
          { postId: 'post-2', xsecToken: 'token-2' },
        ],
      };

      const mockResults = [
        {
          postId: 'post-1',
          success: true,
          data: {
            postId: 'post-1',
            title: '帖子1',
            likeCount: 100,
            collectCount: 50,
            commentCount: 20,
            shareCount: 10,
            crawlTime: new Date(),
          },
        },
        {
          postId: 'post-2',
          success: true,
          data: {
            postId: 'post-2',
            title: '帖子2',
            likeCount: 200,
            collectCount: 100,
            commentCount: 40,
            shareCount: 20,
            crawlTime: new Date(),
          },
        },
      ];

      mockCrawlerService.crawlBatch.mockResolvedValue(mockResults);

      const result = await controller.crawlBatch(dto);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResults);
      expect(mockCrawlerService.crawlBatch).toHaveBeenCalledWith(dto.posts);
    });

    it('应该返回部分失败的结果', async () => {
      const dto = {
        posts: [
          { postId: 'post-1', xsecToken: 'token-1' },
          { postId: 'post-2', xsecToken: 'token-2' },
        ],
      };

      const mockResults = [
        {
          postId: 'post-1',
          success: true,
          data: {
            postId: 'post-1',
            title: '帖子1',
            likeCount: 100,
            collectCount: 50,
            commentCount: 20,
            shareCount: 10,
            crawlTime: new Date(),
          },
        },
        {
          postId: 'post-2',
          success: false,
          error: '爬取失败',
        },
      ];

      mockCrawlerService.crawlBatch.mockResolvedValue(mockResults);

      const result = await controller.crawlBatch(dto);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResults);
      expect(result.data[0].success).toBe(true);
      expect(result.data[1].success).toBe(false);
    });
  });
});
