import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AccountStatus } from '../enums/account-status.enum';
import { v4 as uuidv4 } from 'uuid';

/**
 * 账号服务
 * 负责账号的创建、查询、更新、删除等核心业务逻辑
 */
@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  /**
   * 创建账号
   * @param dto 创建账号DTO
   * @returns 创建的账号
   */
  async createAccount(dto: CreateAccountDto): Promise<Account> {
    // 验证Cookie格式
    if (!dto.cookie || dto.cookie.trim().length < 10) {
      throw new BadRequestException('Cookie格式无效，长度至少为10个字符');
    }

    // 生成UUID作为账号ID
    const id = uuidv4();

    // 创建账号实体
    const account = this.accountRepository.create({
      id,
      name: dto.name,
      cookie: dto.cookie,
      status: AccountStatus.ACTIVE,
      requestCount: 0,
    });

    // 保存到数据库
    return await this.accountRepository.save(account);
  }

  /**
   * 查询所有账号
   * @param filter 过滤条件
   * @returns 账号列表
   */
  async findAll(filter?: { status?: AccountStatus }): Promise<Account[]> {
    const where = filter?.status ? { status: filter.status } : {};
    return await this.accountRepository.find({ where });
  }

  /**
   * 根据ID查询账号
   * @param id 账号ID
   * @returns 账号
   */
  async findById(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`账号不存在: ${id}`);
    }
    return account;
  }

  /**
   * 获取可用账号（负载均衡策略：选择最少使用的账号）
   * @returns 可用账号
   */
  async getAvailableAccount(): Promise<Account> {
    const accounts = await this.accountRepository.find({
      where: { status: AccountStatus.ACTIVE },
      order: { requestCount: 'ASC' },
    });

    if (accounts.length === 0) {
      throw new NotFoundException('没有可用账号');
    }

    return accounts[0];
  }

  /**
   * 更新账号使用信息
   * @param id 账号ID
   */
  async updateAccountUsage(id: string): Promise<void> {
    const account = await this.findById(id);

    account.requestCount += 1;
    account.lastUsedAt = new Date();

    await this.accountRepository.save(account);
  }

  /**
   * 删除账号
   * @param id 账号ID
   */
  async deleteAccount(id: string): Promise<void> {
    const account = await this.findById(id);
    await this.accountRepository.delete(account.id);
  }
}
