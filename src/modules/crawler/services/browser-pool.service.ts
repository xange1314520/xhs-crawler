import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PuppeteerBrowserInstance } from './browser-instance.puppeteer';
import { BrowserStatus } from '../enums/browser-status.enum';

/**
 * 浏览器连接池服务
 * 管理多个浏览器实例，提供获取、释放、健康检查等功能
 */
@Injectable()
export class BrowserPoolService implements OnModuleInit {
  private readonly logger = new Logger(BrowserPoolService.name);
  private readonly browsers: Map<string, PuppeteerBrowserInstance> = new Map();
  private readonly minSize: number;
  private readonly maxSize: number;
  private readonly idleTimeout: number;
  private waitingQueue: Array<{
    resolve: (browser: PuppeteerBrowserInstance) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(private readonly configService: ConfigService) {
    this.minSize = this.configService.get<number>('BROWSER_POOL_MIN_SIZE', 2);
    this.maxSize = this.configService.get<number>('BROWSER_POOL_MAX_SIZE', 5);
    this.idleTimeout = this.configService.get<number>(
      'BROWSER_IDLE_TIMEOUT',
      1800000,
    );
  }

  /**
   * NestJS 生命周期钩子：模块初始化时自动调用
   */
  async onModuleInit() {
    await this.initialize();
  }

  /**
   * 初始化浏览器连接池
   */
  async initialize(): Promise<void> {
    this.logger.log(`正在初始化浏览器连接池，预创建${this.minSize}个实例...`);

    for (let i = 0; i < this.minSize; i++) {
      try {
        const browser = this.createBrowser(`browser-${i}`);
        await browser.launch();
        this.browsers.set(browser.id, browser);
        this.logger.log(`浏览器实例 ${browser.id} 启动成功`);
      } catch (error) {
        this.logger.error(`浏览器实例 browser-${i} 启动失败:`, error);
      }
    }

    this.logger.log(`浏览器连接池初始化完成，当前实例数: ${this.browsers.size}`);
  }

  /**
   * 创建浏览器实例
   * @param id 浏览器ID
   * @returns 浏览器实例
   */
  protected createBrowser(id: string): PuppeteerBrowserInstance {
    return new PuppeteerBrowserInstance(id);
  }

  /**
   * 获取可用的浏览器实例
   * @param accountId 账号ID
   * @param cookie Cookie字符串
   * @param timeout 超时时间（毫秒）
   * @returns 浏览器实例
   */
  async getBrowser(
    accountId: string,
    cookie: string,
    timeout: number = 30000,
  ): Promise<PuppeteerBrowserInstance> {
    // 查找空闲的浏览器
    let browser = this.findIdleBrowser();

    if (browser) {
      await browser.setCookie(cookie);
      browser.setBusy();
      this.logger.debug(`为账号 ${accountId} 分配浏览器 ${browser.id}`);
      return browser;
    }

    // 如果没有空闲浏览器，且未达到最大池大小，则动态创建新实例
    if (this.browsers.size < this.maxSize) {
      this.logger.log(`🚀 浏览器池未满 (${this.browsers.size}/${this.maxSize})，动态创建新实例`);
      try {
        const newId = `browser-${this.browsers.size}`;
        browser = this.createBrowser(newId);
        await browser.launch();
        this.browsers.set(newId, browser);
        this.logger.log(`✅ 浏览器实例 ${newId} 动态创建成功`);
        
        // 设置 cookie 并分配
        await browser.setCookie(cookie);
        browser.setBusy();
        this.logger.debug(`为账号 ${accountId} 分配新创建的浏览器 ${browser.id}`);
        return browser;
      } catch (error) {
        this.logger.error(`❌ 动态创建浏览器失败: ${error.message}`, error.stack);
        // 创建失败，继续等待现有浏览器
      }
    }

    // 如果已达到最大池大小，或创建失败，则等待空闲浏览器
    this.logger.debug(`没有空闲浏览器，等待中... (当前池大小: ${this.browsers.size}/${this.maxSize})`);
    return this.waitForBrowser(accountId, cookie, timeout);
  }

  /**
   * 等待浏览器可用
   * @param accountId 账号ID
   * @param cookie Cookie
   * @param timeout 超时时间
   * @returns 浏览器实例
   */
  private async waitForBrowser(
    accountId: string,
    cookie: string,
    timeout: number,
  ): Promise<PuppeteerBrowserInstance> {
    return new Promise<PuppeteerBrowserInstance>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.waitingQueue.findIndex(
          (item) => item.resolve === resolve,
        );
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error(`账号 ${accountId} 获取浏览器超时 (${timeout}ms)`));
      }, timeout);

      this.waitingQueue.push({
        resolve: async (browser: PuppeteerBrowserInstance) => {
          clearTimeout(timeoutId);
          await browser.setCookie(cookie);
          browser.setBusy();
          this.logger.debug(`⏰ 账号 ${accountId} 从等待队列获取到浏览器 ${browser.id}`);
          resolve(browser);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      });
    });
  }

  /**
   * 查找空闲的浏览器
   * @returns 空闲的浏览器实例或null
   */
  private findIdleBrowser(): PuppeteerBrowserInstance | null {
    for (const browser of this.browsers.values()) {
      if (browser.getStatus() === BrowserStatus.IDLE && browser.isHealthy()) {
        return browser;
      }
    }
    return null;
  }

  /**
   * 释放浏览器实例
   * @param browserId 浏览器ID
   */
  releaseBrowser(browserId: string): void {
    const browser = this.browsers.get(browserId);
    if (!browser) {
      this.logger.warn(`浏览器 ${browserId} 不存在`);
      return;
    }

    browser.setIdle();
    this.logger.debug(`浏览器 ${browserId} 已释放`);

    // 如果有等待的请求，分配给它
    if (this.waitingQueue.length > 0) {
      const waiting = this.waitingQueue.shift();
      if (waiting) {
        waiting.resolve(browser);
      }
    }
  }

  /**
   * 获取连接池状态
   * @returns 连接池状态
   */
  getPoolStatus(): {
    totalCapacity: number;
    availableInstances: number;
    inUseInstances: number;
  } {
    let availableCount = 0;
    let inUseCount = 0;

    for (const browser of this.browsers.values()) {
      if (browser.getStatus() === BrowserStatus.IDLE) {
        availableCount++;
      } else if (browser.getStatus() === BrowserStatus.BUSY) {
        inUseCount++;
      }
    }

    return {
      totalCapacity: this.browsers.size,
      availableInstances: availableCount,
      inUseInstances: inUseCount,
    };
  }

  /**
   * 检查并重启不健康的浏览器
   */
  async checkAndRestart(): Promise<void> {
    const now = new Date();
    const maxBusyTime = 5 * 60 * 1000; // 5分钟超时
    
    for (const [browserId, browser] of this.browsers.entries()) {
      // 检查1: 浏览器是否健康
      if (!browser.isHealthy()) {
        this.logger.warn(`🔧 浏览器 ${browserId} 不健康（状态: ${browser.getStatus()}），尝试重启...`);
        try {
          await browser.close();
          await browser.launch();
          browser.setIdle(); // 确保状态重置
          this.logger.log(`✅ 浏览器 ${browserId} 重启成功`);
        } catch (error) {
          this.logger.error(`❌ 浏览器 ${browserId} 重启失败，从连接池移除`, error);
          this.browsers.delete(browserId);
          
          // 如果连接池太小，尝试创建新的浏览器补充
          if (this.browsers.size < this.minSize) {
            try {
              const newBrowser = this.createBrowser(`browser-${Date.now()}`);
              await newBrowser.launch();
              this.browsers.set(newBrowser.id, newBrowser);
              this.logger.log(`✅ 创建新浏览器 ${newBrowser.id} 补充连接池`);
            } catch (createError) {
              this.logger.error(`❌ 创建新浏览器失败`, createError);
            }
          }
        }
        continue;
      }
      
      // 检查2: 浏览器是否长时间处于 BUSY 状态
      const lastUsedAt = browser.getLastUsedAt();
      if (browser.getStatus() === BrowserStatus.BUSY && lastUsedAt) {
        const busyDuration = now.getTime() - lastUsedAt.getTime();
        if (busyDuration > maxBusyTime) {
          this.logger.warn(`⚠️ 浏览器 ${browserId} 长时间处于BUSY状态（${Math.round(busyDuration / 1000)}秒），强制释放`);
          browser.setIdle();
          
          // 如果有等待的请求，分配给它
          if (this.waitingQueue.length > 0) {
            const waiting = this.waitingQueue.shift();
            if (waiting) {
              waiting.resolve(browser);
            }
          }
        }
      }
    }
    
    // 打印连接池状态
    const status = this.getPoolStatus();
    this.logger.debug(
      `连接池状态: 总数=${status.totalCapacity}, 空闲=${status.availableInstances}, 使用中=${status.inUseInstances}`,
    );
  }
}
