import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Crawler E2E Test', () => {
  let app: INestApplication;
  const testDbPath = './test-data/test-crawler-e2e.db';
  const testDataDir = path.dirname(testDbPath);
  let accountId: string;

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

    // 配置全局ValidationPipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();

    // 清理测试数据
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  }, 10000); // 增加超时时间到10秒

  describe('完整业务流程', () => {
    it('步骤1: 创建账号', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '爬虫测试账号',
          cookie: 'webBuild=5.3.1;web_session=test_crawler_session;',
        })
        .expect(201);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      accountId = response.body.data.id;
    });

    it('步骤2: 查询账号列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/accounts')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    // 注意：爬取功能需要真实的MCP Browser Tools，在E2E测试中跳过
    it.skip('步骤3: 爬取单个帖子（需要真实浏览器）', async () => {
      const postId = 'test-post-123';
      const xsecToken = 'test-token-xyz';

      const response = await request(app.getHttpServer())
        .get(`/api/posts/${postId}/detail`)
        .query({ xsec_token: xsecToken })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('postId');
    });

    it.skip('步骤4: 批量爬取帖子（需要真实浏览器）', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/posts/batch')
        .send({
          posts: [
            { postId: 'post-1', xsecToken: 'token-1' },
            { postId: 'post-2', xsecToken: 'token-2' },
          ],
        })
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('步骤5: 删除测试账号', async () => {
      await request(app.getHttpServer())
        .delete(`/api/accounts/${accountId}`)
        .expect(200);
    });
  });

  describe('参数校验测试', () => {
    it('批量爬取空数组应该失败', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/posts/batch')
        .send({
          posts: [],
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('批量爬取缺少posts字段应该失败', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/posts/batch')
        .send({})
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('批量爬取posts不是数组应该失败', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/posts/batch')
        .send({
          posts: 'not-an-array',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('API响应格式测试', () => {
    beforeAll(async () => {
      // 创建测试账号
      await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: 'API格式测试账号',
          cookie: 'test-api-format-cookie',
        });
    });

    it('账号查询应该返回标准格式', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/accounts')
        .expect(200);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.code).toBe(200);
    });
  });

  describe('并发测试', () => {
    it('应该支持并发创建账号', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/api/accounts')
            .send({
              name: `并发账号${i}`,
              cookie: `concurrent-cookie-${i}`,
            }),
        );
      }

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result.status).toBe(201);
        expect(result.body.code).toBe(200);
      });
    });

    it('应该支持并发查询账号', async () => {
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app.getHttpServer()).get('/api/accounts'),
        );
      }

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result.status).toBe(200);
        expect(result.body.code).toBe(200);
      });
    });
  });

  describe('数据一致性测试', () => {
    it('创建账号后应该能立即查询到', async () => {
      // 创建账号
      const createResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '一致性测试账号',
          cookie: 'consistency-test-cookie',
        })
        .expect(201);

      const newAccountId = createResponse.body.data.id;

      // 立即查询
      const listResponse = await request(app.getHttpServer())
        .get('/api/accounts')
        .expect(200);

      const foundAccount = listResponse.body.data.find(
        (acc) => acc.id === newAccountId,
      );
      expect(foundAccount).toBeDefined();
      expect(foundAccount.name).toBe('一致性测试账号');
    });

    it('删除账号后不应该再查询到', async () => {
      // 创建账号
      const createResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '待删除账号',
          cookie: 'to-delete-cookie',
        })
        .expect(201);

      const accountToDeleteId = createResponse.body.data.id;

      // 删除账号
      await request(app.getHttpServer())
        .delete(`/api/accounts/${accountToDeleteId}`)
        .expect(200);

      // 验证已删除（再次删除应该404）
      await request(app.getHttpServer())
        .delete(`/api/accounts/${accountToDeleteId}`)
        .expect(404);
    });
  });
});
