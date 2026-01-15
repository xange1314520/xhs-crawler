import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountService } from './account.service';
import { Account } from '../entities/account.entity';
import { AccountStatus } from '../enums/account-status.enum';
import { CreateAccountDto } from '../dto/create-account.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AccountService', () => {
  let service: AccountService;
  let mockRepository: jest.Mocked<Repository<Account>>;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('应该成功创建账号', async () => {
      const dto: CreateAccountDto = {
        name: '测试账号1',
        cookie: 'webBuild=5.3.1;web_session=xxx;',
      };

      const mockAccount = {
        id: expect.any(String),
        name: dto.name,
        cookie: dto.cookie,
        status: AccountStatus.ACTIVE,
        requestCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Account;

      mockRepository.create.mockReturnValue(mockAccount);
      mockRepository.save.mockResolvedValue(mockAccount);

      const result = await service.createAccount(dto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(dto.name);
      expect(result.status).toBe(AccountStatus.ACTIVE);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('应该生成UUID作为账号ID', async () => {
      const dto: CreateAccountDto = {
        name: '测试账号',
        cookie: 'valid-cookie',
      };

      const mockAccount = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      } as Account;

      mockRepository.create.mockReturnValue(mockAccount);
      mockRepository.save.mockResolvedValue(mockAccount);

      const result = await service.createAccount(dto);

      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('应该拒绝无效的Cookie', async () => {
      const dto: CreateAccountDto = {
        name: '测试账号',
        cookie: '',
      };

      await expect(service.createAccount(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('应该返回所有账号', async () => {
      const mockAccounts = [
        { id: '1', name: 'A1', status: AccountStatus.ACTIVE },
        { id: '2', name: 'A2', status: AccountStatus.ACTIVE },
      ] as Account[];

      mockRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.findAll();

      expect(result).toEqual(mockAccounts);
      expect(result.length).toBe(2);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('应该支持status过滤', async () => {
      const mockAccounts = [
        { id: '1', name: 'A1', status: AccountStatus.ACTIVE },
      ] as Account[];

      mockRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.findAll({ status: AccountStatus.ACTIVE });

      expect(result).toEqual(mockAccounts);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: AccountStatus.ACTIVE },
      });
    });

    it('空数据库应该返回空数组', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('应该根据ID查询账号', async () => {
      const mockAccount = {
        id: 'test-id',
        name: '测试',
      } as Account;

      mockRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findById('test-id');

      expect(result).toEqual(mockAccount);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });

    it('不存在的ID应该抛出NotFoundException', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('not-exist')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvailableAccount', () => {
    it('应该返回最少使用的可用账号', async () => {
      // Mock应该返回按requestCount排序的账号（ASC）
      const mockAccounts = [
        { id: '2', requestCount: 5, status: AccountStatus.ACTIVE },
        { id: '3', requestCount: 8, status: AccountStatus.ACTIVE },
        { id: '1', requestCount: 10, status: AccountStatus.ACTIVE },
      ] as Account[];

      mockRepository.find.mockResolvedValue(mockAccounts);

      const result = await service.getAvailableAccount();

      expect(result.id).toBe('2');
      expect(result.requestCount).toBe(5);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: AccountStatus.ACTIVE },
        order: { requestCount: 'ASC' },
      });
    });

    it('当没有可用账号时应该抛出异常', async () => {
      mockRepository.find.mockResolvedValue([]);

      await expect(service.getAvailableAccount()).rejects.toThrow(NotFoundException);
      await expect(service.getAvailableAccount()).rejects.toThrow('没有可用账号');
    });

    it('应该只查询ACTIVE状态的账号', async () => {
      mockRepository.find.mockResolvedValue([]);

      try {
        await service.getAvailableAccount();
      } catch (e) {
        // 期望抛出异常
      }

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: AccountStatus.ACTIVE },
        order: { requestCount: 'ASC' },
      });
    });
  });

  describe('updateAccountUsage', () => {
    it('应该更新账号使用信息', async () => {
      const mockAccount = {
        id: '1',
        requestCount: 5,
        lastUsedAt: new Date('2026-01-01'),
      } as Account;

      mockRepository.findOne.mockResolvedValue(mockAccount);
      mockRepository.save.mockImplementation((account: any) => Promise.resolve(account as Account));

      await service.updateAccountUsage('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          requestCount: 6,
          lastUsedAt: expect.any(Date),
        }),
      );
    });

    it('账号不存在时应该抛出NotFoundException', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateAccountUsage('not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteAccount', () => {
    it('应该成功删除账号', async () => {
      const mockAccount = { id: 'test-id' } as Account;
      mockRepository.findOne.mockResolvedValue(mockAccount);
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.deleteAccount('test-id');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'test-id' } });
      expect(mockRepository.delete).toHaveBeenCalledWith('test-id');
    });

    it('账号不存在时应该抛出NotFoundException', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteAccount('not-exist')).rejects.toThrow(NotFoundException);
    });
  });
});
