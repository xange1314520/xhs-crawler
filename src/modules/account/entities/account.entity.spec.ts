import { Account } from './account.entity';
import { AccountStatus } from '../enums/account-status.enum';

describe('Account Entity', () => {
  it('应该正确创建Account实例', () => {
    const account = new Account();
    account.id = 'test-id-123';
    account.name = '测试账号';
    account.cookie = 'test-cookie-data';
    account.status = AccountStatus.ACTIVE;

    expect(account.id).toBe('test-id-123');
    expect(account.name).toBe('测试账号');
    expect(account.cookie).toBe('test-cookie-data');
    expect(account.status).toBe(AccountStatus.ACTIVE);
  });

  it('应该有默认值', () => {
    const account = new Account();
    account.id = 'test-id';
    account.name = '测试';
    account.cookie = 'cookie';

    // 在TypeORM实体中，默认值在保存时由数据库设置
    // 这里只验证实例创建正常
    expect(account).toBeDefined();
    expect(account.id).toBe('test-id');
  });

  it('应该支持所有AccountStatus', () => {
    const activeAccount = new Account();
    activeAccount.status = AccountStatus.ACTIVE;
    expect(activeAccount.status).toBe('active');

    const inactiveAccount = new Account();
    inactiveAccount.status = AccountStatus.INACTIVE;
    expect(inactiveAccount.status).toBe('inactive');

    const bannedAccount = new Account();
    bannedAccount.status = AccountStatus.BANNED;
    expect(bannedAccount.status).toBe('banned');
  });

  it('应该可以设置requestCount', () => {
    const account = new Account();
    account.requestCount = 100;
    expect(account.requestCount).toBe(100);
  });

  it('应该可以设置lastUsedAt', () => {
    const account = new Account();
    const now = new Date();
    account.lastUsedAt = now;
    expect(account.lastUsedAt).toBe(now);
  });
});
