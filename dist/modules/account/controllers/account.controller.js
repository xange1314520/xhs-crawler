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
exports.AccountController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const account_service_1 = require("../services/account.service");
const create_account_dto_1 = require("../dto/create-account.dto");
const account_response_dto_1 = require("../dto/account-response.dto");
const api_response_1 = require("../../../common/api-response");
const account_status_enum_1 = require("../enums/account-status.enum");
let AccountController = class AccountController {
    constructor(accountService) {
        this.accountService = accountService;
    }
    async createAccount(dto) {
        const account = await this.accountService.createAccount(dto);
        return api_response_1.ApiResponse.success(account);
    }
    async getAccounts(status) {
        const filter = status ? { status: status } : undefined;
        const accounts = await this.accountService.findAll(filter);
        return api_response_1.ApiResponse.success(accounts);
    }
    async deleteAccount(id) {
        await this.accountService.deleteAccount(id);
        return api_response_1.ApiResponse.success(undefined, '删除成功');
    }
};
exports.AccountController = AccountController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建账号', description: '配置新的小红书账号Cookie' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '创建成功',
        type: account_response_dto_1.AccountResponseDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_account_dto_1.CreateAccountDto]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查询账号列表', description: '查询所有账号配置' }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: account_status_enum_1.AccountStatus,
        description: '账号状态筛选',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: [account_response_dto_1.AccountResponseDto],
    }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除账号', description: '删除指定账号' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "deleteAccount", null);
exports.AccountController = AccountController = __decorate([
    (0, swagger_1.ApiTags)('accounts'),
    (0, common_1.Controller)('api/accounts'),
    __metadata("design:paramtypes", [account_service_1.AccountService])
], AccountController);
//# sourceMappingURL=account.controller.js.map