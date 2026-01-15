import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AccountStatus } from '../src/modules/account/enums/account-status.enum';
import * as fs from 'fs';
import * as path from 'path';

describe('Account API (e2e)', () => {
  let app: INestApplication;
  const testDbPath = './test-data/test-e2e.db';
  const testDataDir = path.dirname(testDbPath);

  beforeAll(async () => {
    // 设置测试数据库路径
    process.env.DB_PATH = testDbPath;
    process.env.NODE_ENV = 'development'; // 设置为 development 以启用 synchronize

    // 确保测试数据目录不存在，避免干扰
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // 配置全局ValidationPipe（与main.ts保持一致）
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
  });

  describe('POST /api/accounts', () => {
    it('应该成功创建账号', () => {
      return request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '测试账号1',
          cookie: 'webBuild=5.3.1;web_session=xxx;test=value;',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.message).toBe('success');
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.name).toBe('测试账号1');
          expect(res.body.data.status).toBe(AccountStatus.ACTIVE);
          expect(res.body.data.requestCount).toBe(0);
          expect(res.body.timestamp).toBeDefined();
        });
    });

    it('应该拒绝空名称', () => {
      return request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '',
          cookie: 'valid-cookie-string',
        })
        .expect(400);
    });

    it('应该拒绝短Cookie（长度<10）', () => {
      return request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '测试账号',
          cookie: 'short',
        })
        .expect(400);
    });

    it('应该拒绝缺少必填字段', () => {
      return request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '测试账号',
        })
        .expect(400);
    });
  });

  describe('GET /api/accounts', () => {
    beforeEach(async () => {
      // 创建测试数据
      await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '账号A',
          cookie: 'cookie-a-value-test',
        });
      
      await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '账号B',
          cookie: 'cookie-b-value-test',
        });
    });

    it('应该返回所有账号', () => {
      return request(app.getHttpServer())
        .get('/api/accounts')
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('应该支持status过滤', () => {
      return request(app.getHttpServer())
        .get('/api/accounts')
        .query({ status: 'active' })
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.data).toBeInstanceOf(Array);
          res.body.data.forEach((account) => {
            expect(account.status).toBe(AccountStatus.ACTIVE);
          });
        });
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    let accountId: string;

    beforeEach(async () => {
      // 创建测试账号
      const response = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '待删除账号',
          cookie: 'cookie-to-delete-test',
        });
      
      accountId = response.body.data.id;
    });

    it('应该成功删除账号', () => {
      return request(app.getHttpServer())
        .delete(`/api/accounts/${accountId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.code).toBe(200);
          expect(res.body.message).toBe('删除成功');
        });
    });

    it('删除后账号应该不存在', async () => {
      // 删除账号
      await request(app.getHttpServer())
        .delete(`/api/accounts/${accountId}`)
        .expect(200);

      // 验证账号已被删除（再次删除应该返回404）
      return request(app.getHttpServer())
        .delete(`/api/accounts/${accountId}`)
        .expect(404);
    });

    it('删除不存在的账号应该返回404', () => {
      return request(app.getHttpServer())
        .delete('/api/accounts/non-existent-id')
        .expect(404);
    });
  });

  describe('完整业务流程', () => {
    it('应该支持创建、查询、删除完整流程', async () => {
      // 1. 创建账号
      const createResponse = await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '流程测试账号',
          cookie: 'flow-test-cookie-value',
        })
        .expect(201);

      const accountId = createResponse.body.data.id;
      expect(accountId).toBeDefined();

      // 2. 查询账号列表，验证新账号存在
      const listResponse = await request(app.getHttpServer())
        .get('/api/accounts')
        .expect(200);

      const foundAccount = listResponse.body.data.find(
        (account) => account.id === accountId,
      );
      expect(foundAccount).toBeDefined();
      expect(foundAccount.name).toBe('流程测试账号');

      // 3. 删除账号
      await request(app.getHttpServer())
        .delete(`/api/accounts/${accountId}`)
        .expect(200);

      // 4. 验证账号已删除
      await request(app.getHttpServer())
        .delete(`/api/accounts/${accountId}`)
        .expect(404);
    });
  });
});
