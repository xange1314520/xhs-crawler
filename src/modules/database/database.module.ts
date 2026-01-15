import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbPath = configService.get<string>('DB_PATH', './data/accounts.db');
        
        // 确保数据目录存在
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        const isDevelopment = configService.get<string>('NODE_ENV') === 'development';
        
        // 允许通过环境变量控制 synchronize，默认开发环境启用
        // 生产环境第一次启动时可以设置 TYPEORM_SYNCHRONIZE=true 来创建表
        const synchronize = configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true' 
          ? true 
          : isDevelopment;

        return {
          type: 'sqlite',
          database: dbPath,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize,
          logging: isDevelopment,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
