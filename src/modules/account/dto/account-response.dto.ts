import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '../enums/account-status.enum';

/**
 * 账号响应DTO
 */
export class AccountResponseDto {
  @ApiProperty({
    description: '账号ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '账号名称',
    example: '测试账号1',
  })
  name: string;

  @ApiProperty({
    description: '账号状态',
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  @ApiProperty({
    description: '请求次数',
    example: 123,
  })
  requestCount: number;

  @ApiProperty({
    description: '最后使用时间',
    example: '2026-01-13T10:25:00Z',
    nullable: true,
  })
  lastUsedAt: Date;

  @ApiProperty({
    description: '创建时间',
    example: '2026-01-13T10:00:00Z',
  })
  createdAt: Date;
}
