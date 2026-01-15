"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const account_controller_1 = require("./account.controller");
const account_service_1 = require("../services/account.service");
const account_status_enum_1 = require("../enums/account-status.enum");
describe('AccountController', () => {
    let controller;
    let mockService;
    beforeEach(async () => {
        mockService = {
            createAccount: jest.fn(),
            findAll: jest.fn(),
            deleteAccount: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            controllers: [account_controller_1.AccountController],
            providers: [
                {
                    provide: account_service_1.AccountService,
                    useValue: mockService,
                },
            ],
        }).compile();
        controller = module.get(account_controller_1.AccountController);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /api/accounts', () => {
        it('应该成功创建账号', async () => {
            const dto = {
                name: '测试账号1',
                cookie: 'webBuild=5.3.1;web_session=xxx;',
            };
            const mockAccount = {
                id: 'uuid-1234',
                name: '测试账号1',
                status: account_status_enum_1.AccountStatus.ACTIVE,
                requestCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockService.createAccount.mockResolvedValue(mockAccount);
            const result = await controller.createAccount(dto);
            expect(result.code).toBe(200);
            expect(result.message).toBe('success');
            expect(result.data.id).toBe('uuid-1234');
            expect(result.data.name).toBe('测试账号1');
            expect(mockService.createAccount).toHaveBeenCalledWith(dto);
        });
        it('返回的响应应该包含timestamp', async () => {
            const dto = {
                name: '测试账号',
                cookie: 'valid-cookie',
            };
            mockService.createAccount.mockResolvedValue({});
            const result = await controller.createAccount(dto);
            expect(result.timestamp).toBeDefined();
            expect(typeof result.timestamp).toBe('number');
        });
    });
    describe('GET /api/accounts', () => {
        it('应该返回账号列表', async () => {
            const mockAccounts = [
                {
                    id: '1',
                    name: '账号1',
                    status: account_status_enum_1.AccountStatus.ACTIVE,
                    requestCount: 10,
                },
                {
                    id: '2',
                    name: '账号2',
                    status: account_status_enum_1.AccountStatus.ACTIVE,
                    requestCount: 5,
                },
            ];
            mockService.findAll.mockResolvedValue(mockAccounts);
            const result = await controller.getAccounts();
            expect(result.code).toBe(200);
            expect(result.data.length).toBe(2);
            expect(result.data[0].id).toBe('1');
            expect(mockService.findAll).toHaveBeenCalledWith(undefined);
        });
        it('应该支持status过滤', async () => {
            mockService.findAll.mockResolvedValue([]);
            await controller.getAccounts('active');
            expect(mockService.findAll).toHaveBeenCalledWith({
                status: account_status_enum_1.AccountStatus.ACTIVE,
            });
        });
        it('空数据库应该返回空数组', async () => {
            mockService.findAll.mockResolvedValue([]);
            const result = await controller.getAccounts();
            expect(result.code).toBe(200);
            expect(result.data).toEqual([]);
        });
    });
    describe('DELETE /api/accounts/:id', () => {
        it('应该成功删除账号', async () => {
            mockService.deleteAccount.mockResolvedValue(undefined);
            const result = await controller.deleteAccount('uuid-1234');
            expect(result.code).toBe(200);
            expect(result.message).toBe('删除成功');
            expect(mockService.deleteAccount).toHaveBeenCalledWith('uuid-1234');
        });
        it('删除成功应该没有data字段', async () => {
            mockService.deleteAccount.mockResolvedValue(undefined);
            const result = await controller.deleteAccount('uuid-1234');
            expect(result.data).toBeUndefined();
        });
    });
});
//# sourceMappingURL=account.controller.spec.js.map