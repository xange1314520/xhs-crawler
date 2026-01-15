import { ApiProperty } from '@nestjs/swagger';

/**
 * 帖子详情DTO
 */
export class PostDetailDto {
  @ApiProperty({
    description: '帖子ID',
    example: '65a1b2c3d4e5f6789',
  })
  postId: string;

  @ApiProperty({
    description: '标题',
    example: '这是一篇测试帖子',
  })
  title: string;

  @ApiProperty({
    description: '点赞数',
    example: 1234,
  })
  likeCount: number;

  @ApiProperty({
    description: '收藏数',
    example: 567,
  })
  collectCount: number;

  @ApiProperty({
    description: '评论数',
    example: 89,
  })
  commentCount: number;

  @ApiProperty({
    description: '分享数',
    example: 45,
  })
  shareCount: number;

  @ApiProperty({
    description: '爬取时间',
    example: '2026-01-13T10:30:00Z',
  })
  crawlTime: Date;
}
