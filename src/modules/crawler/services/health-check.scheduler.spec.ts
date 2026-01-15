import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckScheduler } from './health-check.scheduler';
import { BrowserPoolService } from './browser-pool.service';

describe('HealthCheckScheduler', () => {
  let scheduler: HealthCheckScheduler;
  let mockBrowserPoolService: jest.Mocked<BrowserPoolService>;

  beforeEach(async () => {
    mockBrowserPoolService = {
      checkAndRestart: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthCheckScheduler,
        {
          provide: BrowserPoolService,
          useValue: mockBrowserPoolService,
        },
      ],
    }).compile();

    scheduler = module.get<HealthCheckScheduler>(HealthCheckScheduler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleHealthCheck', () => {
    it('应该调用BrowserPoolService的checkAndRestart方法', async () => {
      await scheduler.handleHealthCheck();

      expect(mockBrowserPoolService.checkAndRestart).toHaveBeenCalled();
    });

    it('健康检查失败不应抛出异常', async () => {
      mockBrowserPoolService.checkAndRestart.mockRejectedValue(
        new Error('健康检查失败'),
      );

      await expect(scheduler.handleHealthCheck()).resolves.not.toThrow();
    });

    it('应该记录健康检查日志', async () => {
      const loggerSpy = jest.spyOn((scheduler as any).logger, 'log');

      await scheduler.handleHealthCheck();

      expect(loggerSpy).toHaveBeenCalledWith('开始浏览器连接池健康检查...');
    });

    it('健康检查异常时应该记录错误日志', async () => {
      const error = new Error('健康检查失败');
      mockBrowserPoolService.checkAndRestart.mockRejectedValue(error);

      const loggerSpy = jest.spyOn((scheduler as any).logger, 'error');

      await scheduler.handleHealthCheck();

      expect(loggerSpy).toHaveBeenCalledWith('健康检查失败:', error);
    });
  });
});
