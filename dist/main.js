"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('小红书帖子详情爬取服务')
        .setDescription('提供小红书帖子详情爬取的RESTful API')
        .setVersion('1.0')
        .addTag('accounts', '账号管理')
        .addTag('crawler', '爬取服务')
        .addTag('health', '健康检查')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api-docs', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 服务启动成功！`);
    console.log(`📡 HTTP服务: http://localhost:${port}`);
    console.log(`📚 API文档: http://localhost:${port}/api-docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map