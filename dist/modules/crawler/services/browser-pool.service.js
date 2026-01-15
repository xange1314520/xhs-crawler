"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BrowserPoolService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserPoolService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const browser_instance_puppeteer_1 = require("./browser-instance.puppeteer");
const browser_status_enum_1 = require("../enums/browser-status.enum");
let BrowserPoolService = BrowserPoolService_1 = class BrowserPoolService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(BrowserPoolService_1.name);
        this.browsers = new Map();
        this.waitingQueue = [];
        this.minSize = this.configService.get('BROWSER_POOL_MIN_SIZE', 2);
        this.maxSize = this.configService.get('BROWSER_POOL_MAX_SIZE', 5);
        this.idleTimeout = this.configService.get('BROWSER_IDLE_TIMEOUT', 1800000);
    }
    async onModuleInit() {
        await this.initialize();
    }
    async initialize() {
        this.logger.log(`正在初始化浏览器连接池，预创建${this.minSize}个实例...`);
        for (let i = 0; i < this.minSize; i++) {
            try {
                const browser = this.createBrowser(`browser-${i}`);
                await browser.launch();
                this.browsers.set(browser.id, browser);
                this.logger.log(`浏览器实例 ${browser.id} 启动成功`);
            }
            catch (error) {
                this.logger.error(`浏览器实例 browser-${i} 启动失败:`, error);
            }
        }
        this.logger.log(`浏览器连接池初始化完成，当前实例数: ${this.browsers.size}`);
    }
    createBrowser(id) {
        return new browser_instance_puppeteer_1.PuppeteerBrowserInstance(id);
    }
    async getBrowser(accountId, cookie, timeout = 30000) {
        let browser = this.findIdleBrowser();
        if (browser) {
            await browser.setCookie(cookie);
            browser.setBusy();
            this.logger.debug(`为账号 ${accountId} 分配浏览器 ${browser.id}`);
            return browser;
        }
        if (this.browsers.size < this.maxSize) {
            this.logger.log(`🚀 浏览器池未满 (${this.browsers.size}/${this.maxSize})，动态创建新实例`);
            try {
                const newId = `browser-${this.browsers.size}`;
                browser = this.createBrowser(newId);
                await browser.launch();
                this.browsers.set(newId, browser);
                this.logger.log(`✅ 浏览器实例 ${newId} 动态创建成功`);
                await browser.setCookie(cookie);
                browser.setBusy();
                this.logger.debug(`为账号 ${accountId} 分配新创建的浏览器 ${browser.id}`);
                return browser;
            }
            catch (error) {
                this.logger.error(`❌ 动态创建浏览器失败: ${error.message}`, error.stack);
            }
        }
        this.logger.debug(`没有空闲浏览器，等待中... (当前池大小: ${this.browsers.size}/${this.maxSize})`);
        return this.waitForBrowser(accountId, cookie, timeout);
    }
    async waitForBrowser(accountId, cookie, timeout) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                const index = this.waitingQueue.findIndex((item) => item.resolve === resolve);
                if (index !== -1) {
                    this.waitingQueue.splice(index, 1);
                }
                reject(new Error(`账号 ${accountId} 获取浏览器超时 (${timeout}ms)`));
            }, timeout);
            this.waitingQueue.push({
                resolve: async (browser) => {
                    clearTimeout(timeoutId);
                    await browser.setCookie(cookie);
                    browser.setBusy();
                    this.logger.debug(`⏰ 账号 ${accountId} 从等待队列获取到浏览器 ${browser.id}`);
                    resolve(browser);
                },
                reject: (error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                },
            });
        });
    }
    findIdleBrowser() {
        for (const browser of this.browsers.values()) {
            if (browser.getStatus() === browser_status_enum_1.BrowserStatus.IDLE && browser.isHealthy()) {
                return browser;
            }
        }
        return null;
    }
    releaseBrowser(browserId) {
        const browser = this.browsers.get(browserId);
        if (!browser) {
            this.logger.warn(`浏览器 ${browserId} 不存在`);
            return;
        }
        browser.setIdle();
        this.logger.debug(`浏览器 ${browserId} 已释放`);
        if (this.waitingQueue.length > 0) {
            const waiting = this.waitingQueue.shift();
            if (waiting) {
                waiting.resolve(browser);
            }
        }
    }
    getPoolStatus() {
        let availableCount = 0;
        let inUseCount = 0;
        for (const browser of this.browsers.values()) {
            if (browser.getStatus() === browser_status_enum_1.BrowserStatus.IDLE) {
                availableCount++;
            }
            else if (browser.getStatus() === browser_status_enum_1.BrowserStatus.BUSY) {
                inUseCount++;
            }
        }
        return {
            totalCapacity: this.browsers.size,
            availableInstances: availableCount,
            inUseInstances: inUseCount,
        };
    }
    async checkAndRestart() {
        const now = new Date();
        const maxBusyTime = 5 * 60 * 1000;
        for (const [browserId, browser] of this.browsers.entries()) {
            if (!browser.isHealthy()) {
                this.logger.warn(`🔧 浏览器 ${browserId} 不健康（状态: ${browser.getStatus()}），尝试重启...`);
                try {
                    await browser.close();
                    await browser.launch();
                    browser.setIdle();
                    this.logger.log(`✅ 浏览器 ${browserId} 重启成功`);
                }
                catch (error) {
                    this.logger.error(`❌ 浏览器 ${browserId} 重启失败，从连接池移除`, error);
                    this.browsers.delete(browserId);
                    if (this.browsers.size < this.minSize) {
                        try {
                            const newBrowser = this.createBrowser(`browser-${Date.now()}`);
                            await newBrowser.launch();
                            this.browsers.set(newBrowser.id, newBrowser);
                            this.logger.log(`✅ 创建新浏览器 ${newBrowser.id} 补充连接池`);
                        }
                        catch (createError) {
                            this.logger.error(`❌ 创建新浏览器失败`, createError);
                        }
                    }
                }
                continue;
            }
            const lastUsedAt = browser.getLastUsedAt();
            if (browser.getStatus() === browser_status_enum_1.BrowserStatus.BUSY && lastUsedAt) {
                const busyDuration = now.getTime() - lastUsedAt.getTime();
                if (busyDuration > maxBusyTime) {
                    this.logger.warn(`⚠️ 浏览器 ${browserId} 长时间处于BUSY状态（${Math.round(busyDuration / 1000)}秒），强制释放`);
                    browser.setIdle();
                    if (this.waitingQueue.length > 0) {
                        const waiting = this.waitingQueue.shift();
                        if (waiting) {
                            waiting.resolve(browser);
                        }
                    }
                }
            }
        }
        const status = this.getPoolStatus();
        this.logger.debug(`连接池状态: 总数=${status.totalCapacity}, 空闲=${status.availableInstances}, 使用中=${status.inUseInstances}`);
    }
};
exports.BrowserPoolService = BrowserPoolService;
exports.BrowserPoolService = BrowserPoolService = BrowserPoolService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BrowserPoolService);
//# sourceMappingURL=browser-pool.service.js.map