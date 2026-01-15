"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const account_entity_1 = require("./account.entity");
const account_status_enum_1 = require("../enums/account-status.enum");
describe('Account Entity', () => {
    it('应该正确创建Account实例', () => {
        const account = new account_entity_1.Account();
        account.id = 'test-id-123';
        account.name = '测试账号';
        account.cookie = 'test-cookie-data';
        account.status = account_status_enum_1.AccountStatus.ACTIVE;
        expect(account.id).toBe('test-id-123');
        expect(account.name).toBe('测试账号');
        expect(account.cookie).toBe('test-cookie-data');
        expect(account.status).toBe(account_status_enum_1.AccountStatus.ACTIVE);
    });
    it('应该有默认值', () => {
        const account = new account_entity_1.Account();
        account.id = 'test-id';
        account.name = '测试';
        account.cookie = 'cookie';
        expect(account).toBeDefined();
        expect(account.id).toBe('test-id');
    });
    it('应该支持所有AccountStatus', () => {
        const activeAccount = new account_entity_1.Account();
        activeAccount.status = account_status_enum_1.AccountStatus.ACTIVE;
        expect(activeAccount.status).toBe('active');
        const inactiveAccount = new account_entity_1.Account();
        inactiveAccount.status = account_status_enum_1.AccountStatus.INACTIVE;
        expect(inactiveAccount.status).toBe('inactive');
        const bannedAccount = new account_entity_1.Account();
        bannedAccount.status = account_status_enum_1.AccountStatus.BANNED;
        expect(bannedAccount.status).toBe('banned');
    });
    it('应该可以设置requestCount', () => {
        const account = new account_entity_1.Account();
        account.requestCount = 100;
        expect(account.requestCount).toBe(100);
    });
    it('应该可以设置lastUsedAt', () => {
        const account = new account_entity_1.Account();
        const now = new Date();
        account.lastUsedAt = now;
        expect(account.lastUsedAt).toBe(now);
    });
});
//# sourceMappingURL=account.entity.spec.js.map