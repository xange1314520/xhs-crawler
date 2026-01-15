/**
 * 浏览器实例状态枚举
 */
export enum BrowserStatus {
  /** 空闲 */
  IDLE = 'idle',
  
  /** 忙碌 */
  BUSY = 'busy',
  
  /** 错误 */
  ERROR = 'error',
  
  /** 未初始化 */
  UNINITIALIZED = 'uninitialized',
}
