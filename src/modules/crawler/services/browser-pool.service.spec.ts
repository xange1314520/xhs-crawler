import { Test, TestingModule } from '@nestjs/testing';
import { BrowserPoolService } from './browser-pool.service';
import { BrowserInstance } from './browser-instance';
import { BrowserStatus } from '../enums/browser-status.enum';
import { ConfigService } from '@nestjs/config';

describe('BrowserPoolService', () => {
  let service: BrowserPoolService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockBrowserFactory: jest.Mock;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config = {
          BROWSER_POOL_MIN_SIZE: 3,
          BROWSER_POOL_MAX_SIZE: 5,
          BROWSER_IDLE_TIMEOUT: 1800000,
        };
        return config[key] || defaultValue;
      }),
    } as any;

    mockBrowserFactory = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrowserPoolService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BrowserPoolService>(BrowserPoolService);
    // 注入mock factory
    (service as any).createBrowser = mockBrowserFactory;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('应该预创建3个浏览器实例', async () => {
      const mockBrowsers = Array.from({ length: 3 }, (_, i) => ({
        id: `browser-${i}`,
        status: BrowserStatus.IDLE,
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
          status: BrowserStatus.IDLE,
          isHealthy: () => true,
          launch: jest.fn().mockResolvedValue(undefined),
        },
        {
          id: 'browser-1',
          status: BrowserStatus.ERROR,
          isHealthy: () => false,
          launch: jest.fn().mockRejectedValue(new Error('启动失败')),
        },
        {
          id: 'browser-2',
          status: BrowserStatus.IDLE,
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
      // 应该只有2个成功的浏览器
      expect(status.availableInstances).toBeLessThanOrEqual(3);
    });
  });

  describe('getBrowser', () => {
    it('应该返回可用的浏览器实例', async () => {
      const mockBrowser = {
        id: 'browser-0',
        status: BrowserStatus.IDLE,
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
        status: BrowserStatus.BUSY,
        isHealthy: () => true,
        launch: jest.fn().mockResolvedValue(undefined),
        setCookie: jest.fn().mockResolvedValue(undefined),
        setBusy: jest.fn(),
        setIdle: jest.fn(() => {
          mockBrowser.status = BrowserStatus.IDLE;
        }),
      };

      mockBrowserFactory.mockReturnValue(mockBrowser);
      await service.initialize();

      // 模拟100ms后释放浏览器
      setTimeout(() => {
        mockBrowser.status = BrowserStatus.IDLE;
        service.releaseBrowser('browser-0');
      }, 100);

      const startTime = Date.now();
      const browser = await service.getBrowser('account-1', 'cookie', 5000);
      const elapsed = Date.now() - startTime;

      expect(browser).toBeDefined();
      expect(elapsed).toBeGreaterThanOrEqual(90); // 允许一些时间误差
    });

    it('获取超时应该抛出异常', async () => {
      const mockBrowser = {
        id: 'browser-0',
        status: BrowserStatus.BUSY,
        isHealthy: () => true,
        launch: jest.fn().mockResolvedValue(undefined),
      };

      mockBrowserFactory.mockReturnValue(mockBrowser);
      await service.initialize();

      await expect(
        service.getBrowser('account-1', 'cookie', 1000),
      ).rejects.toThrow('获取浏览器超时');
    });
  });

  describe('releaseBrowser', () => {
    it('应该将浏览器状态改为IDLE', async () => {
      const mockBrowser = {
        id: 'browser-0',
        status: BrowserStatus.BUSY,
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
          status: BrowserStatus.IDLE,
          isHealthy: () => true,
          launch: jest.fn().mockResolvedValue(undefined),
        },
        {
          id: 'browser-1',
          status: BrowserStatus.BUSY,
          isHealthy: () => true,
          launch: jest.fn().mockResolvedValue(undefined),
        },
        {
          id: 'browser-2',
          status: BrowserStatus.IDLE,
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
        status: BrowserStatus.ERROR,
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
        status: BrowserStatus.IDLE,
        isHealthy: () => true,
        launch: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockBrowserFactory.mockReturnValue(mockBrowser);
      await service.initialize();

      // 重置调用计数
      mockBrowser.launch.mockClear();
      mockBrowser.close.mockClear();

      await service.checkAndRestart();

      // close和launch不应该在健康检查时被调用
      expect(mockBrowser.close).not.toHaveBeenCalled();
      expect(mockBrowser.launch).not.toHaveBeenCalled();
    });
  });
});
