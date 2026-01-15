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
exports.BatchCrawlUserDto = exports.BatchCrawlUserItem = exports.CrawlUserRequestDto = exports.UserInfoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UserInfoDto {
}
exports.UserInfoDto = UserInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户ID',
        example: 'USER_ID_HERE',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '昵称',
        example: '大钻戒玩具',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "nickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'IP属地',
        example: '辽宁',
    }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "ipLocation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '粉丝数',
        example: 1234,
    }),
    __metadata("design:type", Number)
], UserInfoDto.prototype, "fansCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '关注数',
        example: 56,
    }),
    __metadata("design:type", Number)
], UserInfoDto.prototype, "followCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '获赞与收藏数',
        example: 12345,
    }),
    __metadata("design:type", Number)
], UserInfoDto.prototype, "likeCollectCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '笔记数',
        example: 89,
    }),
    __metadata("design:type", Number)
], UserInfoDto.prototype, "noteCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户标签',
        example: ['母婴博主', '探店博主'],
        type: [String],
    }),
    __metadata("design:type", Array)
], UserInfoDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '爬取时间',
        example: '2026-01-13T10:30:00Z',
    }),
    __metadata("design:type", Date)
], UserInfoDto.prototype, "crawlTime", void 0);
class CrawlUserRequestDto {
}
exports.CrawlUserRequestDto = CrawlUserRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户ID或用户URL（支持短链/长链）',
        example: 'https://xhslink.com/m/XXXXXXXXXXX',
    }),
    (0, class_validator_1.IsString)({ message: 'userIdOrUrl必须是字符串' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'userIdOrUrl不能为空' }),
    __metadata("design:type", String)
], CrawlUserRequestDto.prototype, "userIdOrUrl", void 0);
class BatchCrawlUserItem {
}
exports.BatchCrawlUserItem = BatchCrawlUserItem;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户ID或用户URL',
        example: 'https://xhslink.com/m/XXXXXXXXXXX',
    }),
    (0, class_validator_1.IsString)({ message: 'userIdOrUrl必须是字符串' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'userIdOrUrl不能为空' }),
    __metadata("design:type", String)
], BatchCrawlUserItem.prototype, "userIdOrUrl", void 0);
class BatchCrawlUserDto {
}
exports.BatchCrawlUserDto = BatchCrawlUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户列表',
        type: [BatchCrawlUserItem],
        example: [
            { userIdOrUrl: 'https://xhslink.com/m/xxxxxxxxxxx' },
            { userIdOrUrl: 'USER_ID_HERE' },
        ],
    }),
    (0, class_validator_1.IsArray)({ message: 'users必须是数组' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: '至少需要一个用户' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BatchCrawlUserItem),
    __metadata("design:type", Array)
], BatchCrawlUserDto.prototype, "users", void 0);
//# sourceMappingURL=user-info.dto.js.map