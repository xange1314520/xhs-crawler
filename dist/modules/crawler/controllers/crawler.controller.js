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
exports.CrawlerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const crawler_service_1 = require("../services/crawler.service");
const post_detail_dto_1 = require("../dto/post-detail.dto");
const batch_crawl_dto_1 = require("../dto/batch-crawl.dto");
const api_response_1 = require("../../../common/api-response");
let CrawlerController = class CrawlerController {
    constructor(crawlerService) {
        this.crawlerService = crawlerService;
    }
    async crawlPost(postId, xsecToken) {
        const data = await this.crawlerService.crawlPost(postId, xsecToken);
        return api_response_1.ApiResponse.success(data, '爬取成功');
    }
    async crawlBatch(dto) {
        const results = await this.crawlerService.crawlBatch(dto.posts);
        return api_response_1.ApiResponse.success(results, '批量爬取完成');
    }
};
exports.CrawlerController = CrawlerController;
__decorate([
    (0, common_1.Get)(':postId/detail'),
    (0, swagger_1.ApiOperation)({
        summary: '爬取单个帖子详情',
        description: '根据帖子ID和xsec_token爬取小红书帖子的点赞、收藏、评论等详情数据',
    }),
    (0, swagger_1.ApiParam)({
        name: 'postId',
        description: '帖子ID',
        example: '65a1b2c3d4e5f6789',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'xsec_token',
        description: 'xsec_token安全令牌（每个帖子唯一）',
        example: 'XYZ1234567890abcdef',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '爬取成功',
        type: post_detail_dto_1.PostDetailDto,
    }),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, common_1.Query)('xsec_token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "crawlPost", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, swagger_1.ApiOperation)({
        summary: '批量爬取帖子',
        description: '一次性爬取多个帖子的详情数据',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '批量爬取完成',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [batch_crawl_dto_1.BatchCrawlDto]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "crawlBatch", null);
exports.CrawlerController = CrawlerController = __decorate([
    (0, swagger_1.ApiTags)('posts'),
    (0, common_1.Controller)('api/posts'),
    __metadata("design:paramtypes", [crawler_service_1.CrawlerService])
], CrawlerController);
//# sourceMappingURL=crawler.controller.js.map