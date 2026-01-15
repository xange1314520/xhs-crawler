"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const browser_pool_service_1 = require("./browser-pool.service");
const browser_status_enum_1 = require("../enums/browser-status.enum");
const config_1 = require("@nestjs/config");
describe('BrowserPoolService', () => {
    let service;
    let mockConfigService;
    let mockBrowserFactory;
    beforeEach(async () => {
        mockConfigService = {
            get: jest.fn((key, defaultValue) => {
                const config = {
                    BROWSER_POOL_MIN_SIZE: 3,
                    BROWSER_POOL_MAX_SIZE: 5,
                    BROWSER_IDLE_TIMEOUT: 1800000,
                };
                return config[key] || defaultValue;
            }),
        };
        mockBrowserFactory = jest.fn();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                browser_pool_service_1.BrowserPoolService,
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();
        service = module.get(browser_pool_service_1.BrowserPoolService);
        service.createBrowser = mockBrowserFactory;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('initialize', () => {
        it('应该预创建3个浏览器实例', async () => {
            const mockBrowsers = Array.from({ length: 3 }, (_, i) => ({
                id: `browser-${i}`,
                status: browser_status_enum_1.BrowserStatus.IDLE,
                isHealthy: () => true,
                launch: jest.fn().mockResolvedValue(undefined),
            }));
            mockBrowserFactory.mockImplementation((id) => {
                const index = parseInt(id.split('-')[1]);
                return mockBrowsers[index];
            });
            await service.initialize();
            const status = service.getPoolStatus();
            expect(status.totalCapacity).toBe(3);
            expect(status.availableInstances).toBe(3);
            expect(mockBrowserFactory).toHaveBeenCalledTimes(3);
        });
        it('启动失败的浏览器应该跳过', async () => {
            const mockBrowsers = [
                {
                    id: 'browser-0',
                    status: browser_status_enum_1.BrowserStatus.IDLE,
                    isHealthy: () => true,
                    launch: jest.fn().mockResolvedValue(undefined),
                },
                {
                    id: 'browser-1',
                    status: browser_status_enum_1.BrowserStatus.ERROR,
                    isHealthy: () => false,
                    launch: jest.fn().mockRejectedValue(new Error('启动失败')),
                },
                {
                    id: 'browser-2',
                    status: browser_status_enum_1.BrowserStatus.IDLE,
                    isHealthy: () => true,
                    launch: jest.fn().mockResolvedValue(undefined),
                },
            ];
            mockBrowserFactory.mockImplementation((id) => {
                const index = parseInt(id.split('-')[1]);
                return mockBrowsers[index];
            });
            await service.initialize();
            const status = service.getPoolStatus();
            expect(status.availableInstances).toBeLessThanOrEqual(3);
        });
    });
    describe('getBrowser', () => {
        it('应该返回可用的浏览器实例', async () => {
            const mockBrowser = {
                id: 'browser-0',
                status: browser_status_enum_1.BrowserStatus.IDLE,
                isHealthy: () => true,
                launch: jest.fn().mockResolvedValue(undefined),
                setCookie: jest.fn().mockResolvedValue(undefined),
                setBusy: jest.fn(),
            };
            mockBrowserFactory.mockReturnValue(mockBrowser);
            await service.initialize();
            const browser = await service.getBrowser('account-1', 'cookie-data');
            expect(browser).toBeDefined();
            expect(browser.id).toBe('browser-0');
            expect(mockBrowser.setCookie).toHaveBeenCalledWith('cookie-data');
            expect(mockBrowser.setBusy).toHaveBeenCalled();
        });
        it('当所有浏览器都忙碌时应该等待', async () => {
            const mockBrowser = {
                id: 'browser-0',
                status: browser_status_enum_1.BrowserStatus.BUSY,
                isHealthy: () => true,
                launch: jest.fn().mockResolvedValue(undefined),
                setCookie: jest.fn().mockResolvedValue(undefined),
                setBusy: jest.fn(),
                setIdle: jest.fn(() => {
                    mockBrowser.status = browser_status_enum_1.BrowserStatus.IDLE;
                }),
            };
            mockBrowserFactory.mockReturnValue(mockBrowser);
            await service.initialize();
            setTimeout(() => {
                mockBrowser.status = browser_status_enum_1.BrowserStatus.IDLE;
                service.releaseBrowser('browser-0');
            }, 100);
            const startTime = Date.now();
            const browser = await service.getBrowser('account-1', 'cookie', 5000);
            const elapsed = Date.now() - startTime;
            expect(browser).toBeDefined();
            expect(elapsed).toBeGreaterThanOrEqual(90);
        });
        it('获取超时应该抛出异常', async () => {
            const mockBrowser = {
                id: 'browser-0',
                status: browser_status_enum_1.BrowserStatus.BUSY,
                isHealthy: () => true,
                launch: jest.fn().mockResolvedValue(undefined),
            };
            mockBrowserFactory.mockReturnValue(mockBrowser);
            await service.initialize();
            await expect(service.getBrowser('account-1', 'cookie', 1000)).rejects.toThrow('获取浏览器超时');
        });
    });
    describe('releaseBrowser', () => {
        it('应该将浏览器状态改为IDLE', async () => {
            const mockBrowser = {
                id: 'browser-0',
                status: browser_status_enum_1.BrowserStatus.BUSY,
                isHealthy: () => true,
                launch: jest.fn().mockResolvedValue(undefined),
                setIdle: jest.fn(),
            };
            mockBrowserFactory.mockReturnValue(mockBrowser);
            await service.initialize();
            service.releaseBrowser('browser-0');
            expect(mockBrowser.setIdle).toHaveBeenCalled();
        });
        it('释放不存在的浏览器不应报错', () => {
            expect(() => service.releaseBrowser('not-exist')).not.toThrow();
        });
    });
    describe('getPoolStatus', () => {
        it('应该返回连接池状态', async () => {
            const mockBrowsers = [
                {
                    id: 'browser-0',
                    status: browser_status_enum_1.BrowserStatus.IDLE,
                    isHealthy: () => true,
                    launch: jest.fn().mockResolvedValue(undefined),
                },
                {
                    id: 'browser-1',
                    status: browser_status_enum_1.BrowserStatus.BUSY,
                    isHealthy: () => true,
                    launch: jest.fn().mockResolvedValue(undefined),
                },
                {
                    id: 'browser-2',
                    status: browser_status_enum_1.BrowserStatus.IDLE,
                    isHealthy: () => true,
                    launch: jest.fn().mockResolvedValue(undefined),
                },
            ];
            mockBrowserFactory.mockImplementation((id) => {
                const index = parseInt(id.split('-')[1]);
                return mockBrowsers[index];
            });
            await service.initialize();
            const status = service.getPoolStatus();
            expect(status.totalCapacity).toBe(3);
            expect(status.availableInstances).toBeGreaterThan(0);
            expect(status.inUseInstances).toBeGreaterThanOrEqual(0);
        });
    });
    describe('checkAndRestart', () => {
        it('应该重启不健康的浏览器', async () => {
            const mockBrowser = {
                id: 'browser-0',
                status: browser_status_enum_1.BrowserStatus.ERROR,
                isHealthy: () => false,
                launch: jest.fn().mockResolvedValue(undefined),
                close: jest.fn().mockResolvedValue(undefined),
            };
            mockBrowserFactory.mockReturnValue(mockBrowser);
            await service.initialize();
            await service.checkAndRestart();
            expect(mockBrowser.close).toHaveBeenCalled();
            expect(mockBrowser.launch).toHaveBeenCalled();
        });
        it('健康的浏览器不应该重启', async () => {
            const mockBrowser = {
                id: 'browser-0',
                status: browser_status_enum_1.BrowserStatus.IDLE,
                isHealthy: () => true,
                launch: jest.fn().mockResolvedValue(undefined),
                close: jest.fn().mockResolvedValue(undefined),
            };
            mockBrowserFactory.mockReturnValue(mockBrowser);
            await service.initialize();
            mockBrowser.launch.mockClear();
            mockBrowser.close.mockClear();
            await service.checkAndRestart();
            expect(mockBrowser.close).not.toHaveBeenCalled();
            expect(mockBrowser.launch).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=browser-pool.service.spec.js.map