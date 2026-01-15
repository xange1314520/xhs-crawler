import { Injectable, Logger } from '@nestjs/common';
import { PostDetailDto } from '../dto/post-detail.dto';

/**
 * 解析服务
 * 负责解析小红书页面HTML，提取帖子详情数据
 */
@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  /**
   * 解析帖子详情
   * @param postId 帖子ID
   * @param html 页面HTML内容
   * @returns 帖子详情
   */
  parsePostDetail(postId: string, html: string): PostDetailDto {
    try {
      // 尝试从页面中提取JSON数据（优先方式）
      const jsonData = this.extractJsonData(html);
      if (jsonData) {
        return this.parseFromJson(postId, jsonData);
      }

      // 降级到DOM解析
      return this.parseFromDom(postId, html);
    } catch (error) {
      this.logger.error(`解析帖子详情失败: ${postId}`, error);
      // 返回默认值
      return {
        postId,
        title: '',
        likeCount: 0,
        collectCount: 0,
        commentCount: 0,
        shareCount: 0,
        crawlTime: new Date(),
      };
    }
  }

  /**
   * 从JSON数据解析
   * @param postId 帖子ID
   * @param jsonData JSON数据对象
   * @returns 帖子详情
   */
  private parseFromJson(postId: string, jsonData: any): PostDetailDto {
    const note = jsonData.note || {};
    const interactInfo = note.interactInfo || {};

    return {
      postId,
      title: note.title || '',
      likeCount: this.extractNumber(interactInfo.likedCount),
      collectCount: this.extractNumber(interactInfo.collectedCount),
      commentCount: this.extractNumber(interactInfo.commentCount),
      shareCount: this.extractNumber(interactInfo.shareCount),
      crawlTime: new Date(),
    };
  }

  /**
   * 从DOM解析
   * @param postId 帖子ID
   * @param html HTML内容
   * @returns 帖子详情
   */
  private parseFromDom(postId: string, html: string): PostDetailDto {
    // 提取标题（从<title>标签）
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(' - 小红书', '').trim() : '';

    // 提取点赞数
    const likeMatch = html.match(/class="like-count"[^>]*data-count="(\d+)"/i);
    const likeCount = likeMatch ? parseInt(likeMatch[1], 10) : 0;

    // 提取收藏数
    const collectMatch = html.match(/class="collect-count"[^>]*data-count="(\d+)"/i);
    const collectCount = collectMatch ? parseInt(collectMatch[1], 10) : 0;

    // 提取评论数
    const commentMatch = html.match(/class="comment-count"[^>]*data-count="(\d+)"/i);
    const commentCount = commentMatch ? parseInt(commentMatch[1], 10) : 0;

    // 提取分享数
    const shareMatch = html.match(/class="share-count"[^>]*data-count="(\d+)"/i);
    const shareCount = shareMatch ? parseInt(shareMatch[1], 10) : 0;

    return {
      postId,
      title,
      likeCount,
      collectCount,
      commentCount,
      shareCount,
      crawlTime: new Date(),
    };
  }

  /**
   * 从HTML中提取JSON数据
   * @param html HTML内容
   * @returns JSON数据对象或null
   */
  private extractJsonData(html: string): any {
    try {
      // 查找 window.__INITIAL_STATE__ = {...}
      const match = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
      return null;
    } catch (error) {
      this.logger.warn('提取JSON数据失败，降级到DOM解析');
      return null;
    }
  }

  /**
   * 提取数字（处理逗号分隔符）
   * @param value 值
   * @returns 数字
   */
  extractNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    // 如果已经是数字
    if (typeof value === 'number') {
      return value;
    }

    // 转为字符串并移除逗号
    const str = String(value).replace(/,/g, '');
    const num = parseInt(str, 10);

    return isNaN(num) ? 0 : num;
  }
}
