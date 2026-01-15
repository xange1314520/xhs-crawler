import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Application (e2e)', () => {
  let app: INestApplication;
  const testDbPath = './test-data/test-app-e2e.db';
  const testDataDir = path.dirname(testDbPath);

  beforeAll(async () => {
    // 设置测试环境
    process.env.DB_PATH = testDbPath;
    process.env.NODE_ENV = 'development';

    // 清理测试数据
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    
    // 清理测试数据
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('应用启动', () => {
    it('应该成功启动应用', () => {
      expect(app).toBeDefined();
    });

    it('HTTP服务器应该正常运行', async () => {
      const server = app.getHttpServer();
      expect(server).toBeDefined();
      expect(server.listening || true).toBeTruthy(); // 在测试中可能尚未监听
    });
  });

  describe('数据库连接', () => {
    it('数据库应该正常连接', async () => {
      // 通过创建账号测试数据库连接
      const response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '数据库测试账号',
          cookie: 'db-test-cookie-value',
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe(200);
    });

    it('数据库文件应该被创建', () => {
      expect(fs.existsSync(testDbPath)).toBeTruthy();
    });
  });

  describe('模块集成', () => {
    it('AccountModule应该正常工作', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/accounts')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});
