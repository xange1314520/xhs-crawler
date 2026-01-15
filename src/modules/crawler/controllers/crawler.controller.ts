import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CrawlerService } from '../services/crawler.service';
import { PostDetailDto } from '../dto/post-detail.dto';
import { BatchCrawlDto } from '../dto/batch-crawl.dto';
import { ApiResponse } from '../../../common/api-response';

/**
 * 爬虫控制器
 * 提供帖子爬取的RESTful API接口
 */
@ApiTags('posts')
@Controller('api/posts')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  /**
   * 爬取单个帖子详情
   * @param postId 帖子ID
   * @param xsecToken xsec_token安全令牌
   * @returns 帖子详情
   */
  @Get(':postId/detail')
  @ApiOperation({
    summary: '爬取单个帖子详情',
    description: '根据帖子ID和xsec_token爬取小红书帖子的点赞、收藏、评论等详情数据',
  })
  @ApiParam({
    name: 'postId',
    description: '帖子ID',
    example: '65a1b2c3d4e5f6789',
  })
  @ApiQuery({
    name: 'xsec_token',
    description: 'xsec_token安全令牌（每个帖子唯一）',
    example: 'XYZ1234567890abcdef',
  })
  @SwaggerResponse({
    status: 200,
    description: '爬取成功',
    type: PostDetailDto,
  })
  async crawlPost(
    @Param('postId') postId: string,
    @Query('xsec_token') xsecToken: string,
  ): Promise<ApiResponse<PostDetailDto>> {
    const data = await this.crawlerService.crawlPost(postId, xsecToken);
    return ApiResponse.success(data, '爬取成功');
  }

  /**
   * 批量爬取帖子
   * @param dto 批量爬取请求
   * @returns 批量爬取结果
   */
  @Post('batch')
  @ApiOperation({
    summary: '批量爬取帖子',
    description: '一次性爬取多个帖子的详情数据',
  })
  @SwaggerResponse({
    status: 200,
    description: '批量爬取完成',
  })
  async crawlBatch(@Body() dto: BatchCrawlDto): Promise<ApiResponse<any[]>> {
    const results = await this.crawlerService.crawlBatch(dto.posts);
    return ApiResponse.success(results, '批量爬取完成');
  }
}
