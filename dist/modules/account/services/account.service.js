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
exports.AccountService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const account_entity_1 = require("../entities/account.entity");
const account_status_enum_1 = require("../enums/account-status.enum");
const uuid_1 = require("uuid");
let AccountService = class AccountService {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }
    async createAccount(dto) {
        if (!dto.cookie || dto.cookie.trim().length < 10) {
            throw new common_1.BadRequestException('Cookie格式无效，长度至少为10个字符');
        }
        const id = (0, uuid_1.v4)();
        const account = this.accountRepository.create({
            id,
            name: dto.name,
            cookie: dto.cookie,
            status: account_status_enum_1.AccountStatus.ACTIVE,
            requestCount: 0,
        });
        return await this.accountRepository.save(account);
    }
    async findAll(filter) {
        const where = filter?.status ? { status: filter.status } : {};
        return await this.accountRepository.find({ where });
    }
    async findById(id) {
        const account = await this.accountRepository.findOne({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException(`账号不存在: ${id}`);
        }
        return account;
    }
    async getAvailableAccount() {
        const accounts = await this.accountRepository.find({
            where: { status: account_status_enum_1.AccountStatus.ACTIVE },
            order: { requestCount: 'ASC' },
        });
        if (accounts.length === 0) {
            throw new common_1.NotFoundException('没有可用账号');
        }
        return accounts[0];
    }
    async updateAccountUsage(id) {
        const account = await this.findById(id);
        account.requestCount += 1;
        account.lastUsedAt = new Date();
        await this.accountRepository.save(account);
    }
    async deleteAccount(id) {
        const account = await this.findById(id);
        await this.accountRepository.delete(account.id);
    }
};
exports.AccountService = AccountService;
exports.AccountService = AccountService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AccountService);
//# sourceMappingURL=account.service.js.map