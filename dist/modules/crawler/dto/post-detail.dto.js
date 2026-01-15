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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostDetailDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PostDetailDto {
}
exports.PostDetailDto = PostDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '帖子ID',
        example: '65a1b2c3d4e5f6789',
    }),
    __metadata("design:type", String)
], PostDetailDto.prototype, "postId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '标题',
        example: '这是一篇测试帖子',
    }),
    __metadata("design:type", String)
], PostDetailDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '点赞数',
        example: 1234,
    }),
    __metadata("design:type", Number)
], PostDetailDto.prototype, "likeCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '收藏数',
        example: 567,
    }),
    __metadata("design:type", Number)
], PostDetailDto.prototype, "collectCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '评论数',
        example: 89,
    }),
    __metadata("design:type", Number)
], PostDetailDto.prototype, "commentCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '分享数',
        example: 45,
    }),
    __metadata("design:type", Number)
], PostDetailDto.prototype, "shareCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '爬取时间',
        example: '2026-01-13T10:30:00Z',
    }),
    __metadata("design:type", Date)
], PostDetailDto.prototype, "crawlTime", void 0);
//# sourceMappingURL=post-detail.dto.js.map