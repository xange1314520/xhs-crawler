"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const account_entity_1 = require("../entities/account.entity");
const account_status_enum_1 = require("../enums/account-status.enum");
describe('AccountRepository', () => {
    let module;
    let repository;
    beforeEach(async () => {
        module = await testing_1.Test.createTestingModule({
            imports: [
                typeorm_1.TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [account_entity_1.Account],
                    synchronize: true,
                    logging: false,
                }),
                typeorm_1.TypeOrmModule.forFeature([account_entity_1.Account]),
            ],
        }).compile();
        repository = module.get((0, typeorm_1.getRepositoryToken)(account_entity_1.Account));
    });
    afterEach(async () => {
        await module.close();
    });
    describe('create', () => {
        it('应该成功创建账号', async () => {
            const account = repository.create({
                id: 'test-id-123',
                name: '测试账号',
                cookie: 'test-cookie',
            });
            const saved = await repository.save(account);
            expect(saved).toBeDefined();
            expect(saved.id).toBe('test-id-123');
            expect(saved.name).toBe('测试账号');
            expect(saved.cookie).toBe('test-cookie');
        });
        it('创建账号时应该有默认值', async () => {
            const account = repository.create({
                id: 'test-id',
                name: '测试',
                cookie: 'cookie',
            });
            const saved = await repository.save(account);
            expect(saved.requestCount).toBe(0);
            expect(saved.status).toBe(account_status_enum_1.AccountStatus.ACTIVE);
            expect(saved.createdAt).toBeDefined();
            expect(saved.updatedAt).toBeDefined();
        });
    });
    describe('findAll', () => {
        it('应该返回所有账号', async () => {
            await repository.save([
                { id: '1', name: 'A1', cookie: 'c1', status: account_status_enum_1.AccountStatus.ACTIVE },
                { id: '2', name: 'A2', cookie: 'c2', status: account_status_enum_1.AccountStatus.ACTIVE },
            ]);
            const accounts = await repository.find();
            expect(accounts.length).toBe(2);
        });
        it('空数据库应该返回空数组', async () => {
            const accounts = await repository.find();
            expect(accounts).toEqual([]);
        });
    });
    describe('findById', () => {
        it('应该根据ID查询账号', async () => {
            const account = await repository.save({
                id: 'test-id',
                name: '测试',
                cookie: 'cookie',
            });
            const found = await repository.findOne({ where: { id: 'test-id' } });
            expect(found).toBeDefined();
            expect(found.id).toBe('test-id');
            expect(found.name).toBe('测试');
        });
        it('不存在的ID应该返回null', async () => {
            const found = await repository.findOne({ where: { id: 'not-exist' } });
            expect(found).toBeNull();
        });
    });
    describe('findAvailableAccounts', () => {
        it('应该只查询可用账号', async () => {
            await repository.save([
                { id: '1', name: 'A1', cookie: 'c1', status: account_status_enum_1.AccountStatus.ACTIVE },
                { id: '2', name: 'A2', cookie: 'c2', status: account_status_enum_1.AccountStatus.BANNED },
                { id: '3', name: 'A3', cookie: 'c3', status: account_status_enum_1.AccountStatus.INACTIVE },
                { id: '4', name: 'A4', cookie: 'c4', status: account_status_enum_1.AccountStatus.ACTIVE },
            ]);
            const accounts = await repository.find({
                where: { status: account_status_enum_1.AccountStatus.ACTIVE },
            });
            expect(accounts.length).toBe(2);
            expect(accounts.every((a) => a.status === account_status_enum_1.AccountStatus.ACTIVE)).toBe(true);
        });
        it('没有可用账号时应该返回空数组', async () => {
            await repository.save([
                { id: '1', name: 'A1', cookie: 'c1', status: account_status_enum_1.AccountStatus.BANNED },
                { id: '2', name: 'A2', cookie: 'c2', status: account_status_enum_1.AccountStatus.INACTIVE },
            ]);
            const accounts = await repository.find({
                where: { status: account_status_enum_1.AccountStatus.ACTIVE },
            });
            expect(accounts.length).toBe(0);
        });
    });
    describe('update', () => {
        it('应该更新账号信息', async () => {
            const account = await repository.save({
                id: 'test-id',
                name: '原名称',
                cookie: 'old-cookie',
            });
            account.name = '新名称';
            account.cookie = 'new-cookie';
            await repository.save(account);
            const updated = await repository.findOne({ where: { id: 'test-id' } });
            expect(updated.name).toBe('新名称');
            expect(updated.cookie).toBe('new-cookie');
        });
        it('应该更新账号使用信息', async () => {
            const account = await repository.save({
                id: 'test-id',
                name: '测试',
                cookie: 'cookie',
                requestCount: 5,
            });
            account.requestCount += 1;
            account.lastUsedAt = new Date();
            await repository.save(account);
            const updated = await repository.findOne({ where: { id: 'test-id' } });
            expect(updated.requestCount).toBe(6);
            expect(updated.lastUsedAt).toBeDefined();
        });
    });
    describe('delete', () => {
        it('应该删除账号', async () => {
            await repository.save({
                id: 'test-id',
                name: '测试',
                cookie: 'cookie',
            });
            await repository.delete('test-id');
            const found = await repository.findOne({ where: { id: 'test-id' } });
            expect(found).toBeNull();
        });
        it('删除不存在的账号不应报错', async () => {
            await expect(repository.delete('not-exist')).resolves.not.toThrow();
        });
    });
    describe('findLeastUsedAccount', () => {
        it('应该返回使用次数最少的账号', async () => {
            await repository.save([
                {
                    id: '1',
                    name: 'A1',
                    cookie: 'c1',
                    status: account_status_enum_1.AccountStatus.ACTIVE,
                    requestCount: 10,
                },
                {
                    id: '2',
                    name: 'A2',
                    cookie: 'c2',
                    status: account_status_enum_1.AccountStatus.ACTIVE,
                    requestCount: 5,
                },
                {
                    id: '3',
                    name: 'A3',
                    cookie: 'c3',
                    status: account_status_enum_1.AccountStatus.ACTIVE,
                    requestCount: 8,
                },
            ]);
            const account = await repository.findOne({
                where: { status: account_status_enum_1.AccountStatus.ACTIVE },
                order: { requestCount: 'ASC' },
            });
            expect(account.id).toBe('2');
            expect(account.requestCount).toBe(5);
        });
    });
});
//# sourceMappingURL=account.repository.spec.js.map