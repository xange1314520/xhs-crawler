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
exports.CrawlPostDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CrawlPostDto {
}
exports.CrawlPostDto = CrawlPostDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '帖子ID',
        example: '65a1b2c3d4e5f6789',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '帖子ID不能为空' }),
    __metadata("design:type", String)
], CrawlPostDto.prototype, "postId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'xsec_token安全令牌（每个帖子唯一）',
        example: 'XYZ1234567890abcdef',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'xsec_token不能为空' }),
    __metadata("design:type", String)
], CrawlPostDto.prototype, "xsecToken", void 0);
//# sourceMappingURL=crawl-post.dto.js.map