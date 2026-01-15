import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 批量爬取项
 */
export class BatchCrawlItem {
  @ApiProperty({
    description: '帖子ID',
    example: '65a1b2c3d4e5f6789',
  })
  @IsString({ message: 'postId必须是字符串' })
  @IsNotEmpty({ message: 'postId不能为空' })
  postId: string;

  @ApiProperty({
    description: 'xsec_token安全令牌（每个帖子唯一）',
    example: 'XYZ1234567890abcdef',
  })
  @IsString({ message: 'xsecToken必须是字符串' })
  @IsNotEmpty({ message: 'xsecToken不能为空' })
  xsecToken: string;
}

/**
 * 批量爬取请求DTO
 */
export class BatchCrawlDto {
  @ApiProperty({
    description: '帖子列表',
    type: [BatchCrawlItem],
    example: [
      { postId: '65a1b2c3d4e5f6789', xsecToken: 'XYZ1234567890abcdef' },
      { postId: '75b2c3d4e5f678910', xsecToken: 'ABC0987654321zyxwv' },
    ],
  })
  @IsArray({ message: 'posts必须是数组' })
  @ArrayMinSize(1, { message: '至少需要一个帖子' })
  @ValidateNested({ each: true })
  @Type(() => BatchCrawlItem)
  posts: BatchCrawlItem[];
}
