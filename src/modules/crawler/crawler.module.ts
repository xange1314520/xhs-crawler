import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BrowserPoolService } from './services/browser-pool.service';
import { HealthCheckScheduler } from './services/health-check.scheduler';
import { ParserService } from './services/parser.service';
import { CrawlerService } from './services/crawler.service';
import { CrawlerController } from './controllers/crawler.controller';
import { UserCrawlerController } from './controllers/user-crawler.controller';
import { AccountModule } from '../account/account.module';

/**
 * 爬虫模块
 * 包含浏览器连接池管理、健康检查、页面解析和帖子爬取、用户信息爬取功能
 */
@Module({
  imports: [ScheduleModule.forRoot(), AccountModule],
  controllers: [CrawlerController, UserCrawlerController],
  providers: [
    BrowserPoolService,
    HealthCheckScheduler,
    ParserService,
    CrawlerService,
  ],
  exports: [BrowserPoolService, CrawlerService],
})
export class CrawlerModule {}
