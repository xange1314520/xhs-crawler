import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from '../services/account.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AccountStatus } from '../enums/account-status.enum';
import { Account } from '../entities/account.entity';

describe('AccountController', () => {
  let controller: AccountController;
  let mockService: jest.Mocked<AccountService>;

  beforeEach(async () => {
    mockService = {
      createAccount: jest.fn(),
      findAll: jest.fn(),
      deleteAccount: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/accounts', () => {
    it('应该成功创建账号', async () => {
      const dto: CreateAccountDto = {
        name: '测试账号1',
        cookie: 'webBuild=5.3.1;web_session=xxx;',
      };

      const mockAccount = {
        id: 'uuid-1234',
        name: '测试账号1',
        status: AccountStatus.ACTIVE,
        requestCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Account;

      mockService.createAccount.mockResolvedValue(mockAccount);

      const result = await controller.createAccount(dto);

      expect(result.code).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data.id).toBe('uuid-1234');
      expect(result.data.name).toBe('测试账号1');
      expect(mockService.createAccount).toHaveBeenCalledWith(dto);
    });

    it('返回的响应应该包含timestamp', async () => {
      const dto: CreateAccountDto = {
        name: '测试账号',
        cookie: 'valid-cookie',
      };

      mockService.createAccount.mockResolvedValue({} as Account);

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
          status: AccountStatus.ACTIVE,
          requestCount: 10,
        },
        {
          id: '2',
          name: '账号2',
          status: AccountStatus.ACTIVE,
          requestCount: 5,
        },
      ] as Account[];

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
        status: AccountStatus.ACTIVE,
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
