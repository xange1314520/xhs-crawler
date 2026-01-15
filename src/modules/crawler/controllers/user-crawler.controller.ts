import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { CrawlerService } from '../services/crawler.service';
import {
  UserInfoDto,
  CrawlUserRequestDto,
  BatchCrawlUserDto,
} from '../dto/user-info.dto';
import { ApiResponse } from '../../../common/api-response';

/**
 * 用户信息爬取控制器
 * 提供用户主页信息爬取的RESTful API接口
 */
@ApiTags('users')
@Controller('api/users')
export class UserCrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  /**
   * 爬取单个用户信息
   * @param dto 爬取用户信息请求
   * @returns 用户信息
   */
  @Post('crawl')
  @ApiOperation({
    summary: '爬取单个用户信息',
    description: '根据用户ID或URL爬取小红书用户主页信息（支持短链/长链）',
  })
  @SwaggerResponse({
    status: 200,
    description: '爬取成功',
    type: UserInfoDto,
  })
  @SwaggerResponse({
    status: 400,
    description: '参数错误',
  })
  @SwaggerResponse({
    status: 500,
    description: '爬取失败',
  })
  async crawlUser(
    @Body() dto: CrawlUserRequestDto,
  ): Promise<ApiResponse<UserInfoDto>> {
    const data = await this.crawlerService.crawlUser(dto.userIdOrUrl);
    return ApiResponse.success(data, '用户信息爬取成功');
  }

  /**
   * 批量爬取用户信息
   * @param dto 批量爬取请求
   * @returns 批量爬取结果
   */
  @Post('batch')
  @ApiOperation({
    summary: '批量爬取用户信息',
    description: '一次性爬取多个用户的主页信息',
  })
  @SwaggerResponse({
    status: 200,
    description: '批量爬取完成',
  })
  @SwaggerResponse({
    status: 400,
    description: '参数错误',
  })
  async crawlUserBatch(
    @Body() dto: BatchCrawlUserDto,
  ): Promise<ApiResponse<any[]>> {
    const results = await this.crawlerService.crawlUserBatch(dto.users);
    return ApiResponse.success(results, '批量爬取用户信息完成');
  }
}
