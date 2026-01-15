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
exports.AccountResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const account_status_enum_1 = require("../enums/account-status.enum");
class AccountResponseDto {
}
exports.AccountResponseDto = AccountResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '账号ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], AccountResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '账号名称',
        example: '测试账号1',
    }),
    __metadata("design:type", String)
], AccountResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '账号状态',
        enum: account_status_enum_1.AccountStatus,
        example: account_status_enum_1.AccountStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], AccountResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '请求次数',
        example: 123,
    }),
    __metadata("design:type", Number)
], AccountResponseDto.prototype, "requestCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '最后使用时间',
        example: '2026-01-13T10:25:00Z',
        nullable: true,
    }),
    __metadata("design:type", Date)
], AccountResponseDto.prototype, "lastUsedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '创建时间',
        example: '2026-01-13T10:00:00Z',
    }),
    __metadata("design:type", Date)
], AccountResponseDto.prototype, "createdAt", void 0);
//# sourceMappingURL=account-response.dto.js.map