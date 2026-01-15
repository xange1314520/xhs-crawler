import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { AccountModule } from './modules/account/account.module';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 数据库模块
    DatabaseModule,
    // 账号管理模块
    AccountModule,
    // 爬虫模块（包含浏览器连接池）
    CrawlerModule,
    // 健康检查模块
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
