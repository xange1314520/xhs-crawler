import { BrowserStatus } from '../enums/browser-status.enum';

/**
 * 浏览器实例
 * 封装单个浏览器的基础操作
 */
export class BrowserInstance {
  public status: BrowserStatus = BrowserStatus.UNINITIALIZED;
  private initialized: boolean = false;

  constructor(
    public readonly id: string,
    private readonly mcpClient: any,
  ) {}

  /**
   * 启动浏览器
   */
  async launch(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 使用MCP启动浏览器并导航到一个空白页
      await this.mcpClient.navigate({ url: 'about:blank' });
      this.status = BrowserStatus.IDLE;
      this.initialized = true;
    } catch (error) {
      this.status = BrowserStatus.ERROR;
      throw error;
    }
  }

  /**
   * 设置Cookie
   * @param cookie Cookie字符串
   */
  async setCookie(cookie: string): Promise<void> {
    try {
      // 使用MCP的evaluate功能设置Cookie
      await this.mcpClient.evaluate({
        function: `() => { document.cookie = "${cookie}"; }`,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 导航到指定URL
   * @param url 目标URL
   */
  async navigate(url: string): Promise<void> {
    try {
      this.status = BrowserStatus.BUSY;
      await this.mcpClient.navigate({ url });
    } catch (error) {
      this.status = BrowserStatus.ERROR;
      throw error;
    }
  }

  /**
   * 获取页面内容
   * @returns 页面HTML内容
   */
  async getPageContent(): Promise<string> {
    try {
      const snapshot = await this.mcpClient.snapshot();
      return snapshot.html || '';
    } catch (error) {
      throw error;
    }
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    this.status = BrowserStatus.UNINITIALIZED;
    this.initialized = false;
  }

  /**
   * 检查浏览器是否健康
   * @returns 是否健康
   */
  isHealthy(): boolean {
    return (
      this.status === BrowserStatus.IDLE ||
      this.status === BrowserStatus.BUSY
    );
  }

  /**
   * 设置状态为空闲
   */
  setIdle(): void {
    this.status = BrowserStatus.IDLE;
  }

  /**
   * 设置状态为忙碌
   */
  setBusy(): void {
    this.status = BrowserStatus.BUSY;
  }
}
