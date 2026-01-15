import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建账号DTO
 */
export class CreateAccountDto {
  @ApiProperty({
    description: '账号名称',
    example: '测试账号1',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: '账号名称不能为空' })
  name: string;

  @ApiProperty({
    description: '小红书Cookie（完整的Cookie字符串）',
    example: 'webBuild=5.3.1;web_session=YOUR_SESSION_TOKEN;websectiga=YOUR_SEC_TOKEN;;...',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty({ message: 'Cookie不能为空' })
  @MinLength(10, { message: 'Cookie长度至少为10个字符' })
  cookie: string;
}
