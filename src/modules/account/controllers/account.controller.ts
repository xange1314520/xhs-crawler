import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiQuery } from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AccountResponseDto } from '../dto/account-response.dto';
import { ApiResponse } from '../../../common/api-response';
import { AccountStatus } from '../enums/account-status.enum';

/**
 * 账号管理控制器
 * 提供账号的创建、查询、删除等RESTful API接口
 */
@ApiTags('accounts')
@Controller('api/accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * 创建账号
   * @param dto 创建账号DTO
   * @returns 创建的账号信息
   */
  @Post()
  @ApiOperation({ summary: '创建账号', description: '配置新的小红书账号Cookie' })
  @SwaggerResponse({
    status: 200,
    description: '创建成功',
    type: AccountResponseDto,
  })
  async createAccount(
    @Body() dto: CreateAccountDto,
  ): Promise<ApiResponse<AccountResponseDto>> {
    const account = await this.accountService.createAccount(dto);
    return ApiResponse.success(account);
  }

  /**
   * 查询账号列表
   * @param status 账号状态（可选）
   * @returns 账号列表
   */
  @Get()
  @ApiOperation({ summary: '查询账号列表', description: '查询所有账号配置' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AccountStatus,
    description: '账号状态筛选',
  })
  @SwaggerResponse({
    status: 200,
    description: '查询成功',
    type: [AccountResponseDto],
  })
  async getAccounts(
    @Query('status') status?: string,
  ): Promise<ApiResponse<AccountResponseDto[]>> {
    const filter = status ? { status: status as AccountStatus } : undefined;
    const accounts = await this.accountService.findAll(filter);
    return ApiResponse.success(accounts);
  }

  /**
   * 删除账号
   * @param id 账号ID
   * @returns 删除结果
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除账号', description: '删除指定账号' })
  @SwaggerResponse({ status: 200, description: '删除成功' })
  async deleteAccount(@Param('id') id: string): Promise<ApiResponse> {
    await this.accountService.deleteAccount(id);
    return ApiResponse.success(undefined, '删除成功');
  }
}
