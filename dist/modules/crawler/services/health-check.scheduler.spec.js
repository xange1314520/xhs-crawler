"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const health_check_scheduler_1 = require("./health-check.scheduler");
const browser_pool_service_1 = require("./browser-pool.service");
describe('HealthCheckScheduler', () => {
    let scheduler;
    let mockBrowserPoolService;
    beforeEach(async () => {
        mockBrowserPoolService = {
            checkAndRestart: jest.fn().mockResolvedValue(undefined),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                health_check_scheduler_1.HealthCheckScheduler,
                {
                    provide: browser_pool_service_1.BrowserPoolService,
                    useValue: mockBrowserPoolService,
                },
            ],
        }).compile();
        scheduler = module.get(health_check_scheduler_1.HealthCheckScheduler);
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
            mockBrowserPoolService.checkAndRestart.mockRejectedValue(new Error('健康检查失败'));
            await expect(scheduler.handleHealthCheck()).resolves.not.toThrow();
        });
        it('应该记录健康检查日志', async () => {
            const loggerSpy = jest.spyOn(scheduler.logger, 'log');
            await scheduler.handleHealthCheck();
            expect(loggerSpy).toHaveBeenCalledWith('开始浏览器连接池健康检查...');
        });
        it('健康检查异常时应该记录错误日志', async () => {
            const error = new Error('健康检查失败');
            mockBrowserPoolService.checkAndRestart.mockRejectedValue(error);
            const loggerSpy = jest.spyOn(scheduler.logger, 'error');
            await scheduler.handleHealthCheck();
            expect(loggerSpy).toHaveBeenCalledWith('健康检查失败:', error);
        });
    });
});
//# sourceMappingURL=health-check.scheduler.spec.js.map