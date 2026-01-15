"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCrawlerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const crawler_service_1 = require("../services/crawler.service");
const user_info_dto_1 = require("../dto/user-info.dto");
const api_response_1 = require("../../../common/api-response");
let UserCrawlerController = class UserCrawlerController {
    constructor(crawlerService) {
        this.crawlerService = crawlerService;
    }
    async crawlUser(dto) {
        const data = await this.crawlerService.crawlUser(dto.userIdOrUrl);
        return api_response_1.ApiResponse.success(data, '用户信息爬取成功');
    }
    async crawlUserBatch(dto) {
        const results = await this.crawlerService.crawlUserBatch(dto.users);
        return api_response_1.ApiResponse.success(results, '批量爬取用户信息完成');
    }
};
exports.UserCrawlerController = UserCrawlerController;
__decorate([
    (0, common_1.Post)('crawl'),
    (0, swagger_1.ApiOperation)({
        summary: '爬取单个用户信息',
        description: '根据用户ID或URL爬取小红书用户主页信息（支持短链/长链）',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '爬取成功',
        type: user_info_dto_1.UserInfoDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '参数错误',
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: '爬取失败',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_info_dto_1.CrawlUserRequestDto]),
    __metadata("design:returntype", Promise)
], UserCrawlerController.prototype, "crawlUser", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, swagger_1.ApiOperation)({
        summary: '批量爬取用户信息',
        description: '一次性爬取多个用户的主页信息',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '批量爬取完成',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '参数错误',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_info_dto_1.BatchCrawlUserDto]),
    __metadata("design:returntype", Promise)
], UserCrawlerController.prototype, "crawlUserBatch", null);
exports.UserCrawlerController = UserCrawlerController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('api/users'),
    __metadata("design:paramtypes", [crawler_service_1.CrawlerService])
], UserCrawlerController);
//# sourceMappingURL=user-crawler.controller.js.map