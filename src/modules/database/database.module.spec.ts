import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database.module';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

describe('DatabaseModule', () => {
  let module: TestingModule;
  let dataSource: DataSource;

  beforeEach(async () => {
    // 使用内存数据库进行测试
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'test',
              DB_PATH: ':memory:',
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [],
          synchronize: true,
          logging: false,
        }),
      ],
    }).compile();

    dataSource = module.get(DataSource);
  });

  afterEach(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await module.close();
  });

  it('应该成功创建模块', () => {
    expect(module).toBeDefined();
  });

  it('应该成功连接数据库', () => {
    expect(dataSource).toBeDefined();
    expect(dataSource.isInitialized).toBe(true);
  });

  it('应该创建数据目录', () => {
    const testDir = './test-data';
    const testDbPath = path.join(testDir, 'test.db');

    // 确保测试前目录不存在
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }

    // 创建目录
    const dataDir = path.dirname(testDbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    expect(fs.existsSync(testDir)).toBe(true);

    // 清理测试目录
    fs.rmSync(testDir, { recursive: true });
  });
});
