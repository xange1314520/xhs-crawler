import { Injectable, Logger } from '@nestjs/common';
import { BrowserPoolService } from './browser-pool.service';
import { AccountService } from '../../account/services/account.service';
import { ParserService } from './parser.service';
import { PostDetailDto } from '../dto/post-detail.dto';
import { UserInfoDto } from '../dto/user-info.dto';

/**
 * 爬虫服务
 * 负责协调浏览器连接池、账号管理和页面解析，完成帖子爬取
 */
@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private readonly browserPoolService: BrowserPoolService,
    private readonly accountService: AccountService,
    private readonly parserService: ParserService,
  ) {}

  /**
   * 爬取单个帖子详情
   * @param postId 帖子ID
   * @param xsecToken 安全令牌
   * @returns 帖子详情
   */
  async crawlPost(postId: string, xsecToken: string): Promise<PostDetailDto> {
    this.logger.log(`开始爬取帖子: ${postId}`);

    let browser = null;
    let accountId = null;

    try {
      // 1. 获取可用账号
      const account = await this.accountService.getAvailableAccount();
      accountId = account.id;
      this.logger.debug(`使用账号: ${account.name} (${account.id})`);

      // 2. 获取浏览器实例
      browser = await this.browserPoolService.getBrowser(
        account.id,
        account.cookie,
      );
      this.logger.debug(`分配浏览器: ${browser.id}`);

      // 3. 构建URL（带xsec_token）
      const url = `https://www.xiaohongshu.com/explore/${postId}?xsec_token=${xsecToken}`;
      
      // 4. 导航到帖子页面
      await browser.navigate(url);
      this.logger.debug(`导航成功: ${url}`);

      // 5. 执行JavaScript获取页面数据
      let postDetail: PostDetailDto;
      try {
        const pageData = await browser.evaluate(() => {
          // 尝试从 window.__INITIAL_STATE__ 获取数据
          const initialState = (window as any).__INITIAL_STATE__;
          
          // 初始化结果对象
          let result: any = {
            success: false,
            title: '',
            likeCount: 0,
            collectCount: 0,
            commentCount: 0,
            shareCount: 0,
            debug: {
              hasInitialState: !!initialState,
              keys: initialState ? Object.keys(initialState) : [],
            }
          };
          
          if (!initialState || !initialState.note) {
            result.debug.error = 'No initialState or note found';
            return result;
          }
          
          result.debug.hasNote = true;
          result.debug.noteKeys = Object.keys(initialState.note);
          
          // 尝试多种可能的数据结构，直接提取数据（不序列化整个对象）
          let note: any = null;
          
          // 方式1: noteDetailMap
          if (initialState.note.noteDetailMap) {
            const noteIds = Object.keys(initialState.note.noteDetailMap);
            result.debug.noteDetailMapKeys = noteIds;
            result.debug.noteDetailMapCount = noteIds.length;
            
            if (noteIds.length > 0) {
              const noteId = noteIds[0];
              result.debug.firstNoteId = noteId;
              const noteDetail = initialState.note.noteDetailMap[noteId];
              
              if (noteDetail) {
                result.debug.noteDetailKeys = Object.keys(noteDetail);
                note = noteDetail.note;
                result.debug.source = 'noteDetailMap';
              }
            }
          }
          
          // 方式2: 直接在 note 对象中
          if (!note && initialState.note.note) {
            note = initialState.note.note;
            result.debug.source = 'note.note';
          }
          
          // 方式3: 直接是 note 本身（如果有title字段）
          if (!note && initialState.note.title) {
            note = initialState.note;
            result.debug.source = 'note';
          }
          
          // 如果找到了note对象，提取数据
          if (note) {
            result.debug.hasNoteData = true;
            result.debug.noteFields = Object.keys(note);
            
            // 直接提取字段值，不序列化整个对象
            result.success = true;
            result.title = note.title || note.desc || '';
            
            // 提取互动数据
            if (note.interactInfo) {
              result.likeCount = note.interactInfo.likedCount || 0;
              result.collectCount = note.interactInfo.collectedCount || 0;
              result.commentCount = note.interactInfo.commentCount || 0;
              result.shareCount = note.interactInfo.shareCount || 0;
              result.debug.interactInfoKeys = Object.keys(note.interactInfo);
            } else {
              // 尝试从note对象直接获取
              result.likeCount = note.likedCount || 0;
              result.collectCount = note.collectedCount || 0;
              result.commentCount = note.commentCount || 0;
              result.shareCount = note.shareCount || 0;
              result.debug.noInteractInfo = true;
            }
            
            return result;
          }
          
          // 降级方案：从 DOM 元素获取
          const titleEl = document.querySelector('.title') || document.querySelector('h1') || document.querySelector('[class*="title"]');
          result.title = titleEl ? titleEl.textContent?.trim() || '' : '';
          result.debug.fallbackToDom = true;
          
          return result;
        });

        // 记录调试信息
        this.logger.debug(`页面数据结构: ${JSON.stringify(pageData.debug, null, 2)}`);
        
        postDetail = {
          postId,
          title: pageData.title,
          likeCount: pageData.likeCount,
          collectCount: pageData.collectCount,
          commentCount: pageData.commentCount,
          shareCount: pageData.shareCount,
          crawlTime: new Date(),
        };

        if (pageData.success) {
          this.logger.log(`JavaScript解析成功: 标题="${postDetail.title}", 点赞=${postDetail.likeCount}, 收藏=${postDetail.collectCount}`);
        } else {
          this.logger.warn(`JavaScript解析部分失败，仅获取到标题: "${postDetail.title}"`);
        }
      } catch (evalError) {
        this.logger.warn(`JavaScript解析失败，降级到HTML解析: ${evalError.message}`);
        
        // 6. 降级：获取HTML内容并解析
        const html = await browser.getPageContent();
        postDetail = this.parserService.parsePostDetail(postId, html);
      }

      this.logger.log(`帖子爬取成功: ${postId}`);

      // 7. 更新账号使用信息
      await this.accountService.updateAccountUsage(accountId);

      return postDetail;
    } catch (error) {
      this.logger.error(`爬取帖子失败: ${postId}`, error);
      throw error;
    } finally {
      // 8. 释放浏览器
      if (browser) {
        this.browserPoolService.releaseBrowser(browser.id);
        this.logger.debug(`释放浏览器: ${browser.id}`);
      }
    }
  }

  /**
   * 批量爬取帖子（并发执行）
   * @param posts 帖子列表（包含postId和xsecToken）
   * @returns 爬取结果列表
   */
  async crawlBatch(
    posts: Array<{ postId: string; xsecToken: string }>,
  ): Promise<
    Array<{ postId: string; success: boolean; data?: PostDetailDto; error?: string }>
  > {
    const startTime = Date.now();
    this.logger.log(`🚀 开始批量爬取，共 ${posts.length} 个帖子（并发模式）`);

    // 使用 Promise.allSettled 并发执行所有爬取任务
    // 即使部分任务失败，也不会影响其他任务
    const promises = posts.map(async (post) => {
      try {
        const taskStartTime = Date.now();
        const data = await this.crawlPost(post.postId, post.xsecToken);
        const taskDuration = Date.now() - taskStartTime;
        this.logger.debug(`✅ ${post.postId} 爬取成功 (耗时: ${taskDuration}ms)`);
        return {
          postId: post.postId,
          success: true,
          data,
        };
      } catch (error) {
        this.logger.error(`❌ ${post.postId} 爬取失败: ${error.message}`);
        return {
          postId: post.postId,
          success: false,
          error: error.message || '未知错误',
        };
      }
    });

    // 等待所有任务完成
    const settledResults = await Promise.allSettled(promises);

    // 提取结果（保持顺序）
    const results = settledResults.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Promise 本身失败（不太可能，因为我们在内部已经 catch 了）
        return {
          postId: 'unknown',
          success: false,
          error: result.reason?.message || '系统错误',
        };
      }
    });

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    this.logger.log(
      `🎉 批量爬取完成！总耗时: ${totalDuration}ms，成功: ${successCount}，失败: ${failCount}，平均: ${Math.round(totalDuration / posts.length)}ms/个`,
    );

    return results;
  }

  /**
   * 处理用户URL（支持短链和长链）
   * @param userIdOrUrl 用户ID或URL
   * @returns 用户ID和完整URL
   */
  private async processUserUrl(
    userIdOrUrl: string,
  ): Promise<{ userId: string; url: string }> {
    // 如果是短链
    if (userIdOrUrl.includes('xhslink.com')) {
      this.logger.debug(`检测到短链: ${userIdOrUrl}`);
      return { userId: '', url: userIdOrUrl }; // 短链需要通过浏览器跳转获取真实URL
    }

    // 如果是长链
    if (userIdOrUrl.includes('xiaohongshu.com/user/profile/')) {
      const userIdMatch = userIdOrUrl.match(/\/user\/profile\/([a-f0-9]+)/);
      const userId = userIdMatch ? userIdMatch[1] : '';
      this.logger.debug(`从长链提取userId: ${userId}`);
      return { userId, url: userIdOrUrl };
    }

    // 如果是纯userId
    if (/^[a-f0-9]{24}$/.test(userIdOrUrl)) {
      this.logger.debug(`检测到userId: ${userIdOrUrl}`);
      const url = `https://www.xiaohongshu.com/user/profile/${userIdOrUrl}`;
      return { userId: userIdOrUrl, url };
    }

    throw new Error(`无效的用户ID或URL: ${userIdOrUrl}`);
  }

  /**
   * 爬取单个用户信息
   * @param userIdOrUrl 用户ID或URL
   * @returns 用户信息
   */
  async crawlUser(userIdOrUrl: string): Promise<UserInfoDto> {
    this.logger.log(`开始爬取用户信息: ${userIdOrUrl}`);

    let browser = null;
    let accountId = null;

    try {
      // 1. 处理用户URL
      const { userId: initialUserId, url } =
        await this.processUserUrl(userIdOrUrl);

      // 2. 获取可用账号
      const account = await this.accountService.getAvailableAccount();
      accountId = account.id;
      this.logger.debug(`使用账号: ${account.name} (${account.id})`);

      // 3. 获取浏览器实例
      browser = await this.browserPoolService.getBrowser(
        account.id,
        account.cookie,
      );
      this.logger.debug(`分配浏览器: ${browser.id}`);

      // 4. 导航到用户主页
      await browser.navigate(url);
      this.logger.debug(`导航成功: ${url}`);

      // 5. 如果是短链，获取跳转后的真实URL并提取userId
      let userId = initialUserId;
      if (!userId) {
        const currentUrl = await browser.evaluate(() => window.location.href);
        const userIdMatch = currentUrl.match(/\/user\/profile\/([a-f0-9]+)/);
        userId = userIdMatch ? userIdMatch[1] : '';
        this.logger.debug(`从跳转后URL提取userId: ${userId}`);
      }

      // 6. 执行JavaScript获取页面数据
      const userData = await browser.evaluate(() => {
        const initialState = (window as any).__INITIAL_STATE__;
        if (!initialState || !initialState.user) {
          return null;
        }

        const user = initialState.user;
        // Vue 3 响应式对象：直接访问 _value 内部数据
        const userPageDataRaw = user.userPageData?._value || user.userPageData || {};
        
        // 小红书用户页面数据结构
        const basicInfo = userPageDataRaw.basicInfo || {};
        const interactionsArray = userPageDataRaw.interactions || [];
        
        // 从 interactions 数组中提取统计数据
        // interactions: [{type, name, count}, ...]
        // 注意：数组元素也是响应式对象，需要访问 _value
        let fansCount = 0;
        let followCount = 0;
        let likeCollectCount = 0;
        let noteCount = 0;
        
        if (Array.isArray(interactionsArray)) {
          interactionsArray.forEach((itemRaw: any) => {
            // 解包响应式对象
            const item = itemRaw._value || itemRaw;
            const name = (item.name || '').toLowerCase();
            const type = (item.type || '').toLowerCase();
            // count 统一转换为数字
            const count = parseInt(String(item.count || '0'), 10) || 0;
            
            if (name.includes('粉丝') || type.includes('fans')) {
              fansCount = count;
            } else if (name.includes('关注') || type.includes('follow')) {
              followCount = count;
            } else if (name.includes('获赞') || name.includes('收藏') || type.includes('liked')) {
              likeCollectCount = count;
            } else if (name.includes('笔记') || type.includes('note')) {
              noteCount = count;
            }
          });
        }
        
        // 如果 interactions 没有 noteCount，尝试从 basicInfo 获取
        if (noteCount === 0 && basicInfo.noteCount) {
          noteCount = parseInt(String(basicInfo.noteCount), 10) || 0;
        }
        
        // 如果还是0，尝试从 userPageDataRaw 直接获取
        if (noteCount === 0 && userPageDataRaw.noteCount) {
          noteCount = parseInt(String(userPageDataRaw.noteCount), 10) || 0;
        }
        
        // 提取用户标签（从 imageCoverInfoList）
        let tags: string[] = [];
        if (userPageDataRaw.imageCoverInfoList && Array.isArray(userPageDataRaw.imageCoverInfoList)) {
          tags = userPageDataRaw.imageCoverInfoList
            .slice(0, 5)
            .map((item: any) => {
              const itemData = item._value || item;
              return itemData.name || '';
            })
            .filter((name: string) => name);
        }
        
        // 如果没有标签，尝试从 basicInfo.tags 获取
        if (tags.length === 0 && basicInfo.tags && Array.isArray(basicInfo.tags)) {
          tags = basicInfo.tags.slice(0, 5).filter((tag: string) => tag);
        }
        
        // 如果还是没有，尝试从 basicInfo.imageCoverInfoList 获取
        if (tags.length === 0 && basicInfo.imageCoverInfoList && Array.isArray(basicInfo.imageCoverInfoList)) {
          tags = basicInfo.imageCoverInfoList
            .slice(0, 5)
            .map((item: any) => {
              const itemData = item._value || item;
              return itemData.name || '';
            })
            .filter((name: string) => name);
        }
        
        // 调试：查找 noteCount 和 tags 的位置
        const debugNoteAndTags = {
          userPageDataRawKeys: Object.keys(userPageDataRaw).slice(0, 30),
          basicInfoKeys: Object.keys(basicInfo).slice(0, 30),
          noteCountSources: {
            fromInteractions: noteCount,
            fromBasicInfo: basicInfo.noteCount,
            fromUserPageData: userPageDataRaw.noteCount,
          },
          imageCoverInfoListLength: userPageDataRaw.imageCoverInfoList?.length || 0,
          firstImageCover: userPageDataRaw.imageCoverInfoList?.[0],
        };
        
        return {
          userId: basicInfo.userId || basicInfo.red_id || '',
          nickname: basicInfo.nickname || '',
          ipLocation: basicInfo.ipLocation || '',
          fansCount,
          followCount,
          likeCollectCount,
          noteCount,
          tags,
          _debugNoteAndTags: debugNoteAndTags,
        };
      });

      if (!userData) {
        throw new Error('未能获取用户数据，页面结构可能已变化');
      }

      this.logger.log(
        `用户信息爬取成功: ${userData.nickname || userId}, 粉丝=${userData.fansCount}, 笔记=${userData.noteCount}`,
      );

      return {
        ...userData,
        userId: userId || userData.userId,
        crawlTime: new Date(),
      };
    } catch (error) {
      this.logger.error(`用户信息爬取失败: ${userIdOrUrl}`, error.stack);
      throw error;
    } finally {
      // 释放浏览器
      if (browser) {
        this.browserPoolService.releaseBrowser(browser.id);
        this.logger.debug(`释放浏览器: ${browser.id}`);
      }
    }
  }

  /**
   * 批量爬取用户信息（并发执行）
   * @param users 用户列表
   * @returns 爬取结果列表
   */
  async crawlUserBatch(
    users: Array<{ userIdOrUrl: string }>,
  ): Promise<
    Array<{ userIdOrUrl: string; success: boolean; data?: UserInfoDto; error?: string }>
  > {
    const startTime = Date.now();
    this.logger.log(`🚀 开始批量爬取用户信息，共 ${users.length} 个用户（并发模式）`);

    // 使用 Promise.allSettled 并发执行所有爬取任务
    const promises = users.map(async (user) => {
      try {
        const taskStartTime = Date.now();
        const data = await this.crawlUser(user.userIdOrUrl);
        const taskDuration = Date.now() - taskStartTime;
        this.logger.debug(
          `✅ ${user.userIdOrUrl} 爬取成功 (耗时: ${taskDuration}ms)`,
        );
        return {
          userIdOrUrl: user.userIdOrUrl,
          success: true,
          data,
        };
      } catch (error) {
        this.logger.error(`❌ ${user.userIdOrUrl} 爬取失败: ${error.message}`);
        return {
          userIdOrUrl: user.userIdOrUrl,
          success: false,
          error: error.message || '未知错误',
        };
      }
    });

    // 等待所有任务完成
    const settledResults = await Promise.allSettled(promises);

    // 提取结果
    const results = settledResults.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          userIdOrUrl: 'unknown',
          success: false,
          error: result.reason?.message || '系统错误',
        };
      }
    });

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    this.logger.log(
      `🎉 批量爬取用户信息完成！总耗时: ${totalDuration}ms，成功: ${successCount}，失败: ${failCount}，平均: ${Math.round(totalDuration / users.length)}ms/个`,
    );

    return results;
  }
}
