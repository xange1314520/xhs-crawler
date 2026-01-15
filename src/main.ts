import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局参数校验管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger API文档配置
  const config = new DocumentBuilder()
    .setTitle('小红书帖子详情爬取服务')
    .setDescription('提供小红书帖子详情爬取的RESTful API')
    .setVersion('1.0')
    .addTag('accounts', '账号管理')
    .addTag('crawler', '爬取服务')
    .addTag('health', '健康检查')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 服务启动成功！`);
  console.log(`📡 HTTP服务: http://localhost:${port}`);
  console.log(`📚 API文档: http://localhost:${port}/api-docs`);
}

bootstrap();
