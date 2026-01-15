"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CrawlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const common_1 = require("@nestjs/common");
const browser_pool_service_1 = require("./browser-pool.service");
const account_service_1 = require("../../account/services/account.service");
const parser_service_1 = require("./parser.service");
let CrawlerService = CrawlerService_1 = class CrawlerService {
    constructor(browserPoolService, accountService, parserService) {
        this.browserPoolService = browserPoolService;
        this.accountService = accountService;
        this.parserService = parserService;
        this.logger = new common_1.Logger(CrawlerService_1.name);
    }
    async crawlPost(postId, xsecToken) {
        this.logger.log(`开始爬取帖子: ${postId}`);
        let browser = null;
        let accountId = null;
        try {
            const account = await this.accountService.getAvailableAccount();
            accountId = account.id;
            this.logger.debug(`使用账号: ${account.name} (${account.id})`);
            browser = await this.browserPoolService.getBrowser(account.id, account.cookie);
            this.logger.debug(`分配浏览器: ${browser.id}`);
            const url = `https://www.xiaohongshu.com/explore/${postId}?xsec_token=${xsecToken}`;
            await browser.navigate(url);
            this.logger.debug(`导航成功: ${url}`);
            let postDetail;
            try {
                const pageData = await browser.evaluate(() => {
                    const initialState = window.__INITIAL_STATE__;
                    let result = {
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
                    let note = null;
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
                    if (!note && initialState.note.note) {
                        note = initialState.note.note;
                        result.debug.source = 'note.note';
                    }
                    if (!note && initialState.note.title) {
                        note = initialState.note;
                        result.debug.source = 'note';
                    }
                    if (note) {
                        result.debug.hasNoteData = true;
                        result.debug.noteFields = Object.keys(note);
                        result.success = true;
                        result.title = note.title || note.desc || '';
                        if (note.interactInfo) {
                            result.likeCount = note.interactInfo.likedCount || 0;
                            result.collectCount = note.interactInfo.collectedCount || 0;
                            result.commentCount = note.interactInfo.commentCount || 0;
                            result.shareCount = note.interactInfo.shareCount || 0;
                            result.debug.interactInfoKeys = Object.keys(note.interactInfo);
                        }
                        else {
                            result.likeCount = note.likedCount || 0;
                            result.collectCount = note.collectedCount || 0;
                            result.commentCount = note.commentCount || 0;
                            result.shareCount = note.shareCount || 0;
                            result.debug.noInteractInfo = true;
                        }
                        return result;
                    }
                    const titleEl = document.querySelector('.title') || document.querySelector('h1') || document.querySelector('[class*="title"]');
                    result.title = titleEl ? titleEl.textContent?.trim() || '' : '';
                    result.debug.fallbackToDom = true;
                    return result;
                });
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
                }
                else {
                    this.logger.warn(`JavaScript解析部分失败，仅获取到标题: "${postDetail.title}"`);
                }
            }
            catch (evalError) {
                this.logger.warn(`JavaScript解析失败，降级到HTML解析: ${evalError.message}`);
                const html = await browser.getPageContent();
                postDetail = this.parserService.parsePostDetail(postId, html);
            }
            this.logger.log(`帖子爬取成功: ${postId}`);
            await this.accountService.updateAccountUsage(accountId);
            return postDetail;
        }
        catch (error) {
            this.logger.error(`爬取帖子失败: ${postId}`, error);
            throw error;
        }
        finally {
            if (browser) {
                this.browserPoolService.releaseBrowser(browser.id);
                this.logger.debug(`释放浏览器: ${browser.id}`);
            }
        }
    }
    async crawlBatch(posts) {
        const startTime = Date.now();
        this.logger.log(`🚀 开始批量爬取，共 ${posts.length} 个帖子（并发模式）`);
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
            }
            catch (error) {
                this.logger.error(`❌ ${post.postId} 爬取失败: ${error.message}`);
                return {
                    postId: post.postId,
                    success: false,
                    error: error.message || '未知错误',
                };
            }
        });
        const settledResults = await Promise.allSettled(promises);
        const results = settledResults.map((result) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            else {
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
        this.logger.log(`🎉 批量爬取完成！总耗时: ${totalDuration}ms，成功: ${successCount}，失败: ${failCount}，平均: ${Math.round(totalDuration / posts.length)}ms/个`);
        return results;
    }
    async processUserUrl(userIdOrUrl) {
        if (userIdOrUrl.includes('xhslink.com')) {
            this.logger.debug(`检测到短链: ${userIdOrUrl}`);
            return { userId: '', url: userIdOrUrl };
        }
        if (userIdOrUrl.includes('xiaohongshu.com/user/profile/')) {
            const userIdMatch = userIdOrUrl.match(/\/user\/profile\/([a-f0-9]+)/);
            const userId = userIdMatch ? userIdMatch[1] : '';
            this.logger.debug(`从长链提取userId: ${userId}`);
            return { userId, url: userIdOrUrl };
        }
        if (/^[a-f0-9]{24}$/.test(userIdOrUrl)) {
            this.logger.debug(`检测到userId: ${userIdOrUrl}`);
            const url = `https://www.xiaohongshu.com/user/profile/${userIdOrUrl}`;
            return { userId: userIdOrUrl, url };
        }
        throw new Error(`无效的用户ID或URL: ${userIdOrUrl}`);
    }
    async crawlUser(userIdOrUrl) {
        this.logger.log(`开始爬取用户信息: ${userIdOrUrl}`);
        let browser = null;
        let accountId = null;
        try {
            const { userId: initialUserId, url } = await this.processUserUrl(userIdOrUrl);
            const account = await this.accountService.getAvailableAccount();
            accountId = account.id;
            this.logger.debug(`使用账号: ${account.name} (${account.id})`);
            browser = await this.browserPoolService.getBrowser(account.id, account.cookie);
            this.logger.debug(`分配浏览器: ${browser.id}`);
            await browser.navigate(url);
            this.logger.debug(`导航成功: ${url}`);
            let userId = initialUserId;
            if (!userId) {
                const currentUrl = await browser.evaluate(() => window.location.href);
                const userIdMatch = currentUrl.match(/\/user\/profile\/([a-f0-9]+)/);
                userId = userIdMatch ? userIdMatch[1] : '';
                this.logger.debug(`从跳转后URL提取userId: ${userId}`);
            }
            const userData = await browser.evaluate(() => {
                const initialState = window.__INITIAL_STATE__;
                if (!initialState || !initialState.user) {
                    return null;
                }
                const user = initialState.user;
                const userPageDataRaw = user.userPageData?._value || user.userPageData || {};
                const basicInfo = userPageDataRaw.basicInfo || {};
                const interactionsArray = userPageDataRaw.interactions || [];
                let fansCount = 0;
                let followCount = 0;
                let likeCollectCount = 0;
                let noteCount = 0;
                if (Array.isArray(interactionsArray)) {
                    interactionsArray.forEach((itemRaw) => {
                        const item = itemRaw._value || itemRaw;
                        const name = (item.name || '').toLowerCase();
                        const type = (item.type || '').toLowerCase();
                        const count = parseInt(String(item.count || '0'), 10) || 0;
                        if (name.includes('粉丝') || type.includes('fans')) {
                            fansCount = count;
                        }
                        else if (name.includes('关注') || type.includes('follow')) {
                            followCount = count;
                        }
                        else if (name.includes('获赞') || name.includes('收藏') || type.includes('liked')) {
                            likeCollectCount = count;
                        }
                        else if (name.includes('笔记') || type.includes('note')) {
                            noteCount = count;
                        }
                    });
                }
                if (noteCount === 0 && basicInfo.noteCount) {
                    noteCount = parseInt(String(basicInfo.noteCount), 10) || 0;
                }
                if (noteCount === 0 && userPageDataRaw.noteCount) {
                    noteCount = parseInt(String(userPageDataRaw.noteCount), 10) || 0;
                }
                let tags = [];
                if (userPageDataRaw.imageCoverInfoList && Array.isArray(userPageDataRaw.imageCoverInfoList)) {
                    tags = userPageDataRaw.imageCoverInfoList
                        .slice(0, 5)
                        .map((item) => {
                        const itemData = item._value || item;
                        return itemData.name || '';
                    })
                        .filter((name) => name);
                }
                if (tags.length === 0 && basicInfo.tags && Array.isArray(basicInfo.tags)) {
                    tags = basicInfo.tags.slice(0, 5).filter((tag) => tag);
                }
                if (tags.length === 0 && basicInfo.imageCoverInfoList && Array.isArray(basicInfo.imageCoverInfoList)) {
                    tags = basicInfo.imageCoverInfoList
                        .slice(0, 5)
                        .map((item) => {
                        const itemData = item._value || item;
                        return itemData.name || '';
                    })
                        .filter((name) => name);
                }
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
            this.logger.log(`用户信息爬取成功: ${userData.nickname || userId}, 粉丝=${userData.fansCount}, 笔记=${userData.noteCount}`);
            return {
                ...userData,
                userId: userId || userData.userId,
                crawlTime: new Date(),
            };
        }
        catch (error) {
            this.logger.error(`用户信息爬取失败: ${userIdOrUrl}`, error.stack);
            throw error;
        }
        finally {
            if (browser) {
                this.browserPoolService.releaseBrowser(browser.id);
                this.logger.debug(`释放浏览器: ${browser.id}`);
            }
        }
    }
    async crawlUserBatch(users) {
        const startTime = Date.now();
        this.logger.log(`🚀 开始批量爬取用户信息，共 ${users.length} 个用户（并发模式）`);
        const promises = users.map(async (user) => {
            try {
                const taskStartTime = Date.now();
                const data = await this.crawlUser(user.userIdOrUrl);
                const taskDuration = Date.now() - taskStartTime;
                this.logger.debug(`✅ ${user.userIdOrUrl} 爬取成功 (耗时: ${taskDuration}ms)`);
                return {
                    userIdOrUrl: user.userIdOrUrl,
                    success: true,
                    data,
                };
            }
            catch (error) {
                this.logger.error(`❌ ${user.userIdOrUrl} 爬取失败: ${error.message}`);
                return {
                    userIdOrUrl: user.userIdOrUrl,
                    success: false,
                    error: error.message || '未知错误',
                };
            }
        });
        const settledResults = await Promise.allSettled(promises);
        const results = settledResults.map((result) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            else {
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
        this.logger.log(`🎉 批量爬取用户信息完成！总耗时: ${totalDuration}ms，成功: ${successCount}，失败: ${failCount}，平均: ${Math.round(totalDuration / users.length)}ms/个`);
        return results;
    }
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [browser_pool_service_1.BrowserPoolService,
        account_service_1.AccountService,
        parser_service_1.ParserService])
], CrawlerService);
//# sourceMappingURL=crawler.service.js.map