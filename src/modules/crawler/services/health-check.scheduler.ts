import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BrowserPoolService } from './browser-pool.service';

/**
 * 健康检查调度器
 * 定时检查浏览器连接池的健康状态，自动重启不健康的浏览器
 */
@Injectable()
export class HealthCheckScheduler {
  private readonly logger = new Logger(HealthCheckScheduler.name);

  constructor(private readonly browserPoolService: BrowserPoolService) {}

  /**
   * 定时健康检查任务（每60秒执行一次）
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleHealthCheck(): Promise<void> {
    try {
      this.logger.log('开始浏览器连接池健康检查...');
      await this.browserPoolService.checkAndRestart();
      this.logger.log('健康检查完成');
    } catch (error) {
      this.logger.error('健康检查失败:', error);
    }
  }
}
