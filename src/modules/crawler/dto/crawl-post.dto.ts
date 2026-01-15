import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 爬取帖子请求DTO
 */
export class CrawlPostDto {
  @ApiProperty({
    description: '帖子ID',
    example: '65a1b2c3d4e5f6789',
  })
  @IsString()
  @IsNotEmpty({ message: '帖子ID不能为空' })
  postId: string;

  @ApiProperty({
    description: 'xsec_token安全令牌（每个帖子唯一）',
    example: 'XYZ1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty({ message: 'xsec_token不能为空' })
  xsecToken: string;
}
