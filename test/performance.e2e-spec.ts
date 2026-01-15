import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Performance E2E Test', () => {
  let app: INestApplication;
  const testDbPath = './test-data/test-performance-e2e.db';
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

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // 预创建5个测试账号
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: `性能测试账号${i}`,
          cookie: `perf-test-cookie-${i}`,
        });
    }
  });

  afterAll(async () => {
    await app.close();

    // 清理测试数据
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  }, 10000);

  describe('API响应时间测试', () => {
    it('账号查询响应时间应该<100ms', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/api/accounts')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(100);
      console.log(`账号查询响应时间: ${responseTime}ms`);
    });

    it('创建账号响应时间应该<200ms', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/api/accounts')
        .send({
          name: '响应时间测试账号',
          cookie: 'response-time-test-cookie',
        })
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
      console.log(`创建账号响应时间: ${responseTime}ms`);
    });

    it.skip('健康检查响应时间应该<50ms（需要实现健康检查路由）', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(50);
      console.log(`健康检查响应时间: ${responseTime}ms`);
    });
  });

  describe('并发性能测试', () => {
    it('应该支持10个并发账号创建请求', async () => {
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/api/accounts')
            .send({
              name: `并发创建账号${i}`,
              cookie: `concurrent-create-cookie-${i}`,
            }),
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 所有请求都应该成功
      results.forEach((result) => {
        expect(result.status).toBe(201);
      });

      // 平均响应时间应该<500ms
      const avgTime = totalTime / 10;
      expect(avgTime).toBeLessThan(500);

      console.log(`10个并发创建请求总耗时: ${totalTime}ms，平均: ${avgTime}ms`);
    });

    it('应该支持5个并发账号查询请求', async () => {
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app.getHttpServer()).get('/api/accounts'),
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 所有请求都应该成功
      results.forEach((result) => {
        expect(result.status).toBe(200);
      });

      // 平均响应时间应该<200ms
      const avgTime = totalTime / 5;
      expect(avgTime).toBeLessThan(200);

      console.log(`5个并发查询请求总耗时: ${totalTime}ms，平均: ${avgTime}ms`);
    });
  });

  describe('数据库性能测试', () => {
    it('串行创建20个账号应该<3秒', async () => {
      const startTime = Date.now();

      // 串行创建，避免连接重置
      for (let i = 0; i < 20; i++) {
        await request(app.getHttpServer())
          .post('/api/accounts')
          .send({
            name: `批量账号${i}`,
            cookie: `batch-cookie-${i}`,
          })
          .expect(201);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(3000);
      console.log(`串行创建20个账号耗时: ${totalTime}ms`);
    });

    it('查询所有账号应该<200ms', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/accounts')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
      expect(response.body.data.length).toBeGreaterThan(10); // 应该有10+个账号

      console.log(`查询${response.body.data.length}个账号耗时: ${responseTime}ms`);
    });
  });

  describe('内存和资源测试', () => {
    it('连续100次请求不应该导致内存泄漏', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 执行100次请求
      for (let i = 0; i < 100; i++) {
        await request(app.getHttpServer()).get('/api/accounts');
      }

      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // 内存增长应该<50MB
      expect(memoryIncrease).toBeLessThan(50);

      console.log(`100次请求后内存增长: ${memoryIncrease.toFixed(2)}MB`);
    });
  });

  describe('稳定性测试', () => {
    it('连续50次快速请求应该全部成功', async () => {
      const results = [];

      for (let i = 0; i < 50; i++) {
        const response = await request(app.getHttpServer())
          .get('/api/accounts');
        results.push(response.status);
      }

      // 所有请求都应该返回200
      const successCount = results.filter(status => status === 200).length;
      expect(successCount).toBe(50);

      console.log(`50次连续请求，成功: ${successCount}/50`);
    });

    it('交替创建和查询50次应该全部成功', async () => {
      let createCount = 0;
      let queryCount = 0;

      for (let i = 0; i < 50; i++) {
        if (i % 2 === 0) {
          // 创建账号
          const response = await request(app.getHttpServer())
            .post('/api/accounts')
            .send({
              name: `交替测试账号${i}`,
              cookie: `alternate-cookie-${i}`,
            });
          if (response.status === 201) createCount++;
        } else {
          // 查询账号
          const response = await request(app.getHttpServer())
            .get('/api/accounts');
          if (response.status === 200) queryCount++;
        }
      }

      expect(createCount).toBe(25);
      expect(queryCount).toBe(25);

      console.log(`交替操作50次，创建成功: ${createCount}/25，查询成功: ${queryCount}/25`);
    });
  });
});
