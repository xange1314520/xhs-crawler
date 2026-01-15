import { Logger } from '@nestjs/common';
import { BrowserStatus } from '../enums/browser-status.enum';
import { v4 as uuidv4 } from 'uuid';

/**
 * 基于 Puppeteer 的真实浏览器实例
 * 替换原有的 Mock 实现
 */
export class PuppeteerBrowserInstance {
  public readonly id: string;
  private status: BrowserStatus = BrowserStatus.UNINITIALIZED;
  private lastUsedAt: Date | null = null;
  private readonly logger = new Logger(PuppeteerBrowserInstance.name);

  // Puppeteer 相关
  private browser: any = null; // import('puppeteer').Browser
  private page: any = null; // import('puppeteer').Page

  constructor(id?: string) {
    this.id = id || uuidv4();
  }

  public getStatus(): BrowserStatus {
    return this.status;
  }

  public getLastUsedAt(): Date | null {
    return this.lastUsedAt;
  }

  public isHealthy(): boolean {
    return (
      (this.status === BrowserStatus.IDLE || this.status === BrowserStatus.BUSY) &&
      this.browser !== null &&
      this.browser.isConnected()
    );
  }

  public setIdle(): void {
    this.status = BrowserStatus.IDLE;
    this.lastUsedAt = new Date();
  }

  public setBusy(): void {
    this.status = BrowserStatus.BUSY;
    this.lastUsedAt = new Date();
  }

  /**
   * 启动浏览器实例
   */
  async launch(): Promise<void> {
    if (this.status !== BrowserStatus.UNINITIALIZED && this.status !== BrowserStatus.ERROR) {
      this.logger.warn(`浏览器实例 ${this.id} 已处于 ${this.status} 状态，无需重复启动。`);
      return;
    }

    this.logger.log(`启动浏览器实例 ${this.id}...`);
    try {
      // 动态导入 Puppeteer
      const puppeteer = await import('puppeteer');

      // 获取浏览器可执行路径
      const executablePath = this.getChromiumExecutablePath();

      // 启动浏览器
      this.browser = await puppeteer.launch({
        headless: true, // 无头模式
        executablePath, // 指定本地 Chrome/Chromium 路径
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // 单进程模式（Docker环境推荐）
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-default-browser-check',
          '--disable-translate',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
        ],
        dumpio: false, // 关闭浏览器日志输出（已经成功启动，不需要了）
      });

      // 创建新页面
      this.page = await this.browser.newPage();

      // 设置视口大小
      await this.page.setViewport({
        width: 1920,
        height: 1080,
      });

      // 设置 User-Agent
      await this.page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      // 启用请求拦截，拦截不必要的资源以加速页面加载
      await this.page.setRequestInterception(true);
      this.page.on('request', (request) => {
        const resourceType = request.resourceType();
        // 只加载文档、脚本和 XHR 请求，拦截图片、样式、字体、媒体等
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      this.status = BrowserStatus.IDLE;
      this.lastUsedAt = new Date();
      this.logger.log(`浏览器实例 ${this.id} 启动成功，状态: ${this.status}`);
    } catch (error) {
      this.status = BrowserStatus.ERROR;
      this.logger.error(`浏览器实例 ${this.id} 启动失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 设置Cookie
   * @param cookieString Cookie字符串
   */
  async setCookie(cookieString: string): Promise<void> {
    if (!this.isHealthy()) {
      throw new Error(`浏览器实例 ${this.id} 不健康，无法设置Cookie。当前状态: ${this.status}`);
    }
    this.setBusy();
    try {
      // 解析 Cookie 字符串
      const cookies = this.parseCookieString(cookieString);

      // 设置 Cookie
      await this.page.setCookie(...cookies);

      this.logger.debug(`浏览器实例 ${this.id} Cookie设置成功`);
    } catch (error) {
      this.status = BrowserStatus.ERROR;
      this.logger.error(`浏览器实例 ${this.id} 设置Cookie失败: ${error.message}`, error.stack);
      throw error;
    } finally {
      this.setIdle();
    }
  }

  /**
   * 导航到指定URL
   * @param url 目标URL
   * @param timeout 导航超时时间 (毫秒)
   */
  async navigate(url: string, timeout = 30000): Promise<void> {
    if (!this.isHealthy()) {
      throw new Error(`浏览器实例 ${this.id} 不健康，无法导航。当前状态: ${this.status}`);
    }
    this.setBusy();
    const startTime = Date.now();
    try {
      // 使用 domcontentloaded，不等待所有资源加载
      // 小红书是 SSR，__INITIAL_STATE__ 在 HTML 中，DOM 加载后立即可用
      // 图片、样式等资源已在 launch() 时被拦截
      await this.page.goto(url, {
        timeout,
        waitUntil: 'domcontentloaded',
      });
      
      const totalTime = Date.now() - startTime;
      this.logger.debug(`浏览器实例 ${this.id} 导航到 ${url} 成功 (耗时: ${totalTime}ms)`);
    } catch (error) {
      this.logger.error(`浏览器实例 ${this.id} 导航到 ${url} 失败: ${error.message}`, error.stack);
      // 不设置为ERROR状态,保持浏览器可用
      throw error;
    } finally {
      this.setIdle();
    }
  }

  /**
   * 获取页面内容
   * @param selector CSS选择器，可选
   * @param timeout 获取超时时间 (毫秒)
   * @returns 页面内容
   */
  async getPageContent(selector?: string, timeout = 10000): Promise<string> {
    if (!this.isHealthy()) {
      throw new Error(`浏览器实例 ${this.id} 不健康，无法获取页面内容。当前状态: ${this.status}`);
    }
    this.setBusy();
    try {
      let content: string;

      if (selector) {
        // 等待选择器出现
        await this.page.waitForSelector(selector, { timeout });
        // 获取指定元素的HTML
        content = await this.page.$eval(selector, (el: any) => el.innerHTML);
      } else {
        // 获取整个页面的HTML
        content = await this.page.content();
      }

      this.logger.debug(`浏览器实例 ${this.id} 成功获取页面内容，长度: ${content.length}`);
      return content;
    } catch (error) {
      this.logger.error(`浏览器实例 ${this.id} 获取页面内容失败: ${error.message}`, error.stack);
      // 不设置为ERROR状态，保持浏览器可用
      throw error;
    } finally {
      this.setIdle();
    }
  }

  /**
   * 执行JavaScript代码并返回结果
   * @param script JavaScript代码
   * @param timeout 执行超时时间 (毫秒)
   * @returns 执行结果
   */
  async evaluate<T = any>(script: string | (() => any), timeout = 10000): Promise<T> {
    if (!this.isHealthy()) {
      throw new Error(`浏览器实例 ${this.id} 不健康，无法执行JavaScript。当前状态: ${this.status}`);
    }
    this.setBusy();
    try {
      // 设置执行超时
      const result = await Promise.race([
        this.page.evaluate(script),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('JavaScript执行超时')), timeout)
        ),
      ]);

      this.logger.debug(`浏览器实例 ${this.id} JavaScript执行成功`);
      return result as T;
    } catch (error) {
      this.logger.error(`浏览器实例 ${this.id} JavaScript执行失败: ${error.message}`, error.stack);
      // 不设置为ERROR状态，保持浏览器可用
      throw error;
    } finally {
      this.setIdle();
    }
  }

  /**
   * 关闭浏览器实例
   */
  async close(): Promise<void> {
    if (this.status === BrowserStatus.UNINITIALIZED) {
      this.logger.warn(`浏览器实例 ${this.id} 未初始化，无需关闭。`);
      return;
    }
    this.logger.log(`关闭浏览器实例 ${this.id}...`);
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.status = BrowserStatus.UNINITIALIZED;
      this.lastUsedAt = null;
      this.logger.log(`浏览器实例 ${this.id} 已关闭`);
    } catch (error) {
      // 连接已关闭的错误不需要抛出，直接清理状态
      if (error.message && error.message.includes('Connection closed')) {
        this.logger.warn(`浏览器实例 ${this.id} 连接已关闭，强制清理状态`);
      } else {
        this.logger.error(`浏览器实例 ${this.id} 关闭失败: ${error.message}`, error.stack);
      }
      // 强制清理状态
      this.page = null;
      this.browser = null;
      this.status = BrowserStatus.UNINITIALIZED;
      this.lastUsedAt = null;
      // 不抛出错误，允许继续重启
    }
  }

  /**
   * 获取 Chromium/Chrome 可执行文件路径
   * 优先级: 环境变量 > 系统默认路径
   * @returns 浏览器可执行路径
   */
  private getChromiumExecutablePath(): string | undefined {
    // 1. 优先从环境变量获取（Docker环境会设置此变量）
    const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (envPath) {
      this.logger.debug(`使用环境变量指定的浏览器路径: ${envPath}`);
      return envPath;
    }

    // 2. 根据操作系统返回常见的 Chrome 路径
    const platform = process.platform;
    const fs = require('fs');

    const chromePaths: { [key: string]: string[] } = {
      darwin: [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        `${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
      ],
      linux: [
        '/usr/bin/chromium-browser',        // Alpine Linux (Docker)
        '/usr/bin/chromium',                 // Alpine Linux (Docker)
        '/usr/bin/google-chrome-stable',    // Debian/Ubuntu
        '/usr/bin/google-chrome',           // Debian/Ubuntu
        '/snap/bin/chromium',               // Snap package
      ],
      win32: [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      ],
    };

    const paths = chromePaths[platform] || [];
    for (const path of paths) {
      try {
        if (fs.existsSync(path)) {
          this.logger.debug(`找到系统 Chrome 路径: ${path}`);
          return path;
        }
      } catch (error) {
        // 忽略文件系统访问错误
      }
    }

    // 3. 如果都找不到，返回 undefined，让 puppeteer 使用其自带的浏览器
    this.logger.warn('未找到系统 Chrome 路径，将使用 Puppeteer 自带浏览器');
    return undefined;
  }

  /**
   * 解析 Cookie 字符串为 Puppeteer Cookie 对象数组
   * @param cookieString Cookie字符串 (格式: key1=value1; key2=value2)
   * @returns Puppeteer Cookie 对象数组
   */
  private parseCookieString(cookieString: string): any[] {
    const cookies = [];
    const pairs = cookieString.split(';');

    for (const pair of pairs) {
      const trimmed = pair.trim();
      if (!trimmed) continue;

      const [name, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('='); // 处理值中可能包含 = 的情况

      cookies.push({
        name: name.trim(),
        value: value || '',
        domain: '.xiaohongshu.com', // 小红书域名
        path: '/',
      });
    }

    return cookies;
  }
}
