import { ApiProperty } from '@nestjs/swagger';

/**
 * 统一API响应格式
 */
export class ApiResponse<T = any> {
  @ApiProperty({ description: '状态码', example: 200 })
  code: number;

  @ApiProperty({ description: '响应消息', example: 'success' })
  message: string;

  @ApiProperty({ description: '响应数据', required: false })
  data?: T;

  @ApiProperty({ description: '时间戳', example: 1705132800000 })
  timestamp: number;

  constructor(code: number, message: string, data?: T) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = Date.now();
  }

  /**
   * 成功响应
   */
  static success<T>(data?: T, message = 'success'): ApiResponse<T> {
    return new ApiResponse(200, message, data);
  }

  /**
   * 错误响应
   */
  static error(code: number, message: string): ApiResponse {
    return new ApiResponse(code, message);
  }
}
