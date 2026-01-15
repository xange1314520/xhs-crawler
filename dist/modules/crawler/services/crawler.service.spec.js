"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const crawler_service_1 = require("./crawler.service");
const browser_pool_service_1 = require("./browser-pool.service");
const account_service_1 = require("../../account/services/account.service");
const parser_service_1 = require("./parser.service");
const account_status_enum_1 = require("../../account/enums/account-status.enum");
describe('CrawlerService', () => {
    let service;
    let mockBrowserPoolService;
    let mockAccountService;
    let mockParserService;
    beforeEach(async () => {
        mockBrowserPoolService = {
            getBrowser: jest.fn(),
            releaseBrowser: jest.fn(),
        };
        mockAccountService = {
            getAvailableAccount: jest.fn(),
            updateAccountUsage: jest.fn(),
        };
        mockParserService = {
            parsePostDetail: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                crawler_service_1.CrawlerService,
                {
                    provide: browser_pool_service_1.BrowserPoolService,
                    useValue: mockBrowserPoolService,
                },
                {
                    provide: account_service_1.AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: parser_service_1.ParserService,
                    useValue: mockParserService,
                },
            ],
        }).compile();
        service = module.get(crawler_service_1.CrawlerService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('crawlPost', () => {
        it('应该成功爬取帖子详情', async () => {
            const postId = 'test-post-id';
            const xsecToken = 'test-xsec-token';
            const mockAccount = {
                id: 'account-1',
                name: '测试账号',
                cookie: 'test-cookie',
                status: account_status_enum_1.AccountStatus.ACTIVE,
                requestCount: 0,
                lastUsedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const mockBrowser = {
                id: 'browser-1',
                navigate: jest.fn().mockResolvedValue(undefined),
                getPageContent: jest.fn().mockResolvedValue('<html>test</html>'),
            };
            const mockPostDetail = {
                postId,
                title: '测试帖子',
                likeCount: 100,
                collectCount: 50,
                commentCount: 20,
                shareCount: 10,
                crawlTime: new Date(),
            };
            mockAccountService.getAvailableAccount.mockResolvedValue(mockAccount);
            mockBrowserPoolService.getBrowser.mockResolvedValue(mockBrowser);
            mockParserService.parsePostDetail.mockReturnValue(mockPostDetail);
            const result = await service.crawlPost(postId, xsecToken);
            expect(result).toEqual(mockPostDetail);
            expect(mockAccountService.getAvailableAccount).toHaveBeenCalled();
            expect(mockBrowserPoolService.getBrowser).toHaveBeenCalledWith(mockAccount.id, mockAccount.cookie);
            expect(mockBrowser.navigate).toHaveBeenCalledWith(expect.stringContaining(postId));
            expect(mockBrowser.navigate).toHaveBeenCalledWith(expect.stringContaining(xsecToken));
            expect(mockBrowser.getPageContent).toHaveBeenCalled();
            expect(mockParserService.parsePostDetail).toHaveBeenCalledWith(postId, '<html>test</html>');
            expect(mockAccountService.updateAccountUsage).toHaveBeenCalledWith(mockAccount.id);
            expect(mockBrowserPoolService.releaseBrowser).toHaveBeenCalledWith(mockBrowser.id);
        });
        it('浏览器导航失败时应该释放浏览器', async () => {
            const postId = 'test-post-id';
            const xsecToken = 'test-xsec-token';
            const mockAccount = {
                id: 'account-1',
                name: '测试账号',
                cookie: 'test-cookie',
                status: account_status_enum_1.AccountStatus.ACTIVE,
                requestCount: 0,
                lastUsedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const mockBrowser = {
                id: 'browser-1',
                navigate: jest.fn().mockRejectedValue(new Error('导航失败')),
            };
            mockAccountService.getAvailableAccount.mockResolvedValue(mockAccount);
            mockBrowserPoolService.getBrowser.mockResolvedValue(mockBrowser);
            await expect(service.crawlPost(postId, xsecToken)).rejects.toThrow('导航失败');
            expect(mockBrowserPoolService.releaseBrowser).toHaveBeenCalledWith(mockBrowser.id);
        });
        it('获取页面内容失败时应该释放浏览器', async () => {
            const postId = 'test-post-id';
            const xsecToken = 'test-xsec-token';
            const mockAccount = {
                id: 'account-1',
                name: '测试账号',
                cookie: 'test-cookie',
                status: account_status_enum_1.AccountStatus.ACTIVE,
                requestCount: 0,
                lastUsedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const mockBrowser = {
                id: 'browser-1',
                navigate: jest.fn().mockResolvedValue(undefined),
                getPageContent: jest.fn().mockRejectedValue(new Error('获取内容失败')),
            };
            mockAccountService.getAvailableAccount.mockResolvedValue(mockAccount);
            mockBrowserPoolService.getBrowser.mockResolvedValue(mockBrowser);
            await expect(service.crawlPost(postId, xsecToken)).rejects.toThrow('获取内容失败');
            expect(mockBrowserPoolService.releaseBrowser).toHaveBeenCalledWith(mockBrowser.id);
        });
        it('没有可用账号时应该抛出异常', async () => {
            mockAccountService.getAvailableAccount.mockRejectedValue(new Error('没有可用账号'));
            await expect(service.crawlPost('test-id', 'token')).rejects.toThrow('没有可用账号');
        });
    });
    describe('crawlBatch', () => {
        it('应该成功批量爬取多个帖子', async () => {
            const posts = [
                { postId: 'post-1', xsecToken: 'token-1' },
                { postId: 'post-2', xsecToken: 'token-2' },
            ];
            const mockAccount = {
                id: 'account-1',
                name: '测试账号',
                cookie: 'test-cookie',
                status: account_status_enum_1.AccountStatus.ACTIVE,
                requestCount: 0,
                lastUsedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const mockBrowser = {
                id: 'browser-1',
                navigate: jest.fn().mockResolvedValue(undefined),
                getPageContent: jest.fn().mockResolvedValue('<html>test</html>'),
            };
            const mockPostDetail = {
                postId: 'test',
                title: '测试',
                likeCount: 10,
                collectCount: 5,
                commentCount: 2,
                shareCount: 1,
                crawlTime: new Date(),
            };
            mockAccountService.getAvailableAccount.mockResolvedValue(mockAccount);
            mockBrowserPoolService.getBrowser.mockResolvedValue(mockBrowser);
            mockParserService.parsePostDetail.mockReturnValue(mockPostDetail);
            const results = await service.crawlBatch(posts);
            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[0].data).toBeDefined();
            expect(results[1].success).toBe(true);
            expect(results[1].data).toBeDefined();
        });
        it('部分失败时应该返回对应的错误', async () => {
            const posts = [
                { postId: 'post-1', xsecToken: 'token-1' },
                { postId: 'post-2', xsecToken: 'token-2' },
            ];
            const mockAccount = {
                id: 'account-1',
                name: '测试账号',
                cookie: 'test-cookie',
                status: account_status_enum_1.AccountStatus.ACTIVE,
                requestCount: 0,
                lastUsedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const mockBrowser = {
                id: 'browser-1',
                navigate: jest.fn().mockResolvedValue(undefined),
                getPageContent: jest.fn().mockResolvedValue('<html>test</html>'),
            };
            const mockPostDetail = {
                postId: 'test',
                title: '测试',
                likeCount: 10,
                collectCount: 5,
                commentCount: 2,
                shareCount: 1,
                crawlTime: new Date(),
            };
            mockAccountService.getAvailableAccount.mockResolvedValue(mockAccount);
            mockBrowserPoolService.getBrowser.mockResolvedValue(mockBrowser);
            mockParserService.parsePostDetail
                .mockReturnValueOnce(mockPostDetail)
                .mockImplementationOnce(() => {
                throw new Error('解析失败');
            });
            const results = await service.crawlBatch(posts);
            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(false);
            expect(results[1].error).toContain('解析失败');
        });
        it('空数组应该返回空结果', async () => {
            const results = await service.crawlBatch([]);
            expect(results).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=crawler.service.spec.js.map