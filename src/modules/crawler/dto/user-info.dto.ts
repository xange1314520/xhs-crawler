import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 用户信息DTO
 */
export class UserInfoDto {
  @ApiProperty({
    description: '用户ID',
    example: 'USER_ID_HERE',
  })
  userId: string;

  @ApiProperty({
    description: '昵称',
    example: '大钻戒玩具',
  })
  nickname: string;

  @ApiProperty({
    description: 'IP属地',
    example: '辽宁',
  })
  ipLocation: string;

  @ApiProperty({
    description: '粉丝数',
    example: 1234,
  })
  fansCount: number;

  @ApiProperty({
    description: '关注数',
    example: 56,
  })
  followCount: number;

  @ApiProperty({
    description: '获赞与收藏数',
    example: 12345,
  })
  likeCollectCount: number;

  @ApiProperty({
    description: '笔记数',
    example: 89,
  })
  noteCount: number;

  @ApiProperty({
    description: '用户标签',
    example: ['母婴博主', '探店博主'],
    type: [String],
  })
  tags: string[];

  @ApiProperty({
    description: '爬取时间',
    example: '2026-01-13T10:30:00Z',
  })
  crawlTime: Date;
}

/**
 * 爬取用户信息请求DTO
 */
export class CrawlUserRequestDto {
  @ApiProperty({
    description: '用户ID或用户URL（支持短链/长链）',
    example: 'https://xhslink.com/m/XXXXXXXXXXX',
  })
  @IsString({ message: 'userIdOrUrl必须是字符串' })
  @IsNotEmpty({ message: 'userIdOrUrl不能为空' })
  userIdOrUrl: string;
}

/**
 * 批量爬取用户信息项
 */
export class BatchCrawlUserItem {
  @ApiProperty({
    description: '用户ID或用户URL',
    example: 'https://xhslink.com/m/XXXXXXXXXXX',
  })
  @IsString({ message: 'userIdOrUrl必须是字符串' })
  @IsNotEmpty({ message: 'userIdOrUrl不能为空' })
  userIdOrUrl: string;
}

/**
 * 批量爬取用户信息请求DTO
 */
export class BatchCrawlUserDto {
  @ApiProperty({
    description: '用户列表',
    type: [BatchCrawlUserItem],
    example: [
      { userIdOrUrl: 'https://xhslink.com/m/xxxxxxxxxxx' },
      { userIdOrUrl: 'USER_ID_HERE' },
    ],
  })
  @IsArray({ message: 'users必须是数组' })
  @ArrayMinSize(1, { message: '至少需要一个用户' })
  @ValidateNested({ each: true })
  @Type(() => BatchCrawlUserItem)
  users: BatchCrawlUserItem[];
}
