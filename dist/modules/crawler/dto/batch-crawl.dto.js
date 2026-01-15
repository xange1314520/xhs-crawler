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
exports.BatchCrawlDto = exports.BatchCrawlItem = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class BatchCrawlItem {
}
exports.BatchCrawlItem = BatchCrawlItem;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '帖子ID',
        example: '65a1b2c3d4e5f6789',
    }),
    (0, class_validator_1.IsString)({ message: 'postId必须是字符串' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'postId不能为空' }),
    __metadata("design:type", String)
], BatchCrawlItem.prototype, "postId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'xsec_token安全令牌（每个帖子唯一）',
        example: 'XYZ1234567890abcdef',
    }),
    (0, class_validator_1.IsString)({ message: 'xsecToken必须是字符串' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'xsecToken不能为空' }),
    __metadata("design:type", String)
], BatchCrawlItem.prototype, "xsecToken", void 0);
class BatchCrawlDto {
}
exports.BatchCrawlDto = BatchCrawlDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '帖子列表',
        type: [BatchCrawlItem],
        example: [
            { postId: '65a1b2c3d4e5f6789', xsecToken: 'XYZ1234567890abcdef' },
            { postId: '75b2c3d4e5f678910', xsecToken: 'ABC0987654321zyxwv' },
        ],
    }),
    (0, class_validator_1.IsArray)({ message: 'posts必须是数组' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: '至少需要一个帖子' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BatchCrawlItem),
    __metadata("design:type", Array)
], BatchCrawlDto.prototype, "posts", void 0);
//# sourceMappingURL=batch-crawl.dto.js.map