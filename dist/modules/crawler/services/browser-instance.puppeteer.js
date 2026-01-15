"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuppeteerBrowserInstance = void 0;
const common_1 = require("@nestjs/common");
const browser_status_enum_1 = require("../enums/browser-status.enum");
const uuid_1 = require("uuid");
class PuppeteerBrowserInstance {
    constructor(id) {
        this.status = browser_status_enum_1.BrowserStatus.UNINITIALIZED;
        this.lastUsedAt = null;
        this.logger = new common_1.Logger(PuppeteerBrowserInstance.name);
        this.browser = null;
        this.page = null;
        this.id = id || (0, uuid_1.v4)();
    }
    getStatus() {
        return this.status;
    }
    getLastUsedAt() {
        return this.lastUsedAt;
    }
    isHealthy() {
        return ((this.status === browser_status_enum_1.BrowserStatus.IDLE || this.status === browser_status_enum_1.BrowserStatus.BUSY) &&
            this.browser !== null &&
            this.browser.isConnected());
    }
    setIdle() {
        this.status = browser_status_enum_1.BrowserStatus.IDLE;
        this.lastUsedAt = new Date();
    }
    setBusy() {
        this.status = browser_status_enum_1.BrowserStatus.BUSY;
        this.lastUsedAt = new Date();
    }
    async launch() {
        if (this.status !== browser_status_enum_1.BrowserStatus.UNINITIALIZED && this.status !== browser_status_enum_1.BrowserStatus.ERROR) {
            this.logger.warn(`浏览器实例 ${this.id} 已处于 ${this.status} 状态，无需重复启动。`);
            return;
        }
        this.logger.log(`启动浏览器实例 ${this.id}...`);
        try {
            const puppeteer = await Promise.resolve().then(() => __importStar(require('puppeteer')));
            const executablePath = this.getChromiumExecutablePath();
            this.browser = await puppeteer.launch({
                headless: true,
                executablePath,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
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
                dumpio: false,
            });
            this.page = await this.browser.newPage();
            await this.page.setViewport({
                width: 1920,
                height: 1080,
            });
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await this.page.setRequestInterception(true);
            this.page.on('request', (request) => {
                const resourceType = request.resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    request.abort();
                }
                else {
                    request.continue();
                }
            });
            this.status = browser_status_enum_1.BrowserStatus.IDLE;
            this.lastUsedAt = new Date();
            this.logger.log(`浏览器实例 ${this.id} 启动成功，状态: ${this.status}`);
        }
        catch (error) {
            this.status = browser_status_enum_1.BrowserStatus.ERROR;
            this.logger.error(`浏览器实例 ${this.id} 启动失败: ${error.message}`, error.stack);
            throw error;
        }
    }
    async setCookie(cookieString) {
        if (!this.isHealthy()) {
            throw new Error(`浏览器实例 ${this.id} 不健康，无法设置Cookie。当前状态: ${this.status}`);
        }
        this.setBusy();
        try {
            const cookies = this.parseCookieString(cookieString);
            await this.page.setCookie(...cookies);
            this.logger.debug(`浏览器实例 ${this.id} Cookie设置成功`);
        }
        catch (error) {
            this.status = browser_status_enum_1.BrowserStatus.ERROR;
            this.logger.error(`浏览器实例 ${this.id} 设置Cookie失败: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            this.setIdle();
        }
    }
    async navigate(url, timeout = 30000) {
        if (!this.isHealthy()) {
            throw new Error(`浏览器实例 ${this.id} 不健康，无法导航。当前状态: ${this.status}`);
        }
        this.setBusy();
        const startTime = Date.now();
        try {
            await this.page.goto(url, {
                timeout,
                waitUntil: 'domcontentloaded',
            });
            const totalTime = Date.now() - startTime;
            this.logger.debug(`浏览器实例 ${this.id} 导航到 ${url} 成功 (耗时: ${totalTime}ms)`);
        }
        catch (error) {
            this.logger.error(`浏览器实例 ${this.id} 导航到 ${url} 失败: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            this.setIdle();
        }
    }
    async getPageContent(selector, timeout = 10000) {
        if (!this.isHealthy()) {
            throw new Error(`浏览器实例 ${this.id} 不健康，无法获取页面内容。当前状态: ${this.status}`);
        }
        this.setBusy();
        try {
            let content;
            if (selector) {
                await this.page.waitForSelector(selector, { timeout });
                content = await this.page.$eval(selector, (el) => el.innerHTML);
            }
            else {
                content = await this.page.content();
            }
            this.logger.debug(`浏览器实例 ${this.id} 成功获取页面内容，长度: ${content.length}`);
            return content;
        }
        catch (error) {
            this.logger.error(`浏览器实例 ${this.id} 获取页面内容失败: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            this.setIdle();
        }
    }
    async evaluate(script, timeout = 10000) {
        if (!this.isHealthy()) {
            throw new Error(`浏览器实例 ${this.id} 不健康，无法执行JavaScript。当前状态: ${this.status}`);
        }
        this.setBusy();
        try {
            const result = await Promise.race([
                this.page.evaluate(script),
                new Promise((_, reject) => setTimeout(() => reject(new Error('JavaScript执行超时')), timeout)),
            ]);
            this.logger.debug(`浏览器实例 ${this.id} JavaScript执行成功`);
            return result;
        }
        catch (error) {
            this.logger.error(`浏览器实例 ${this.id} JavaScript执行失败: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            this.setIdle();
        }
    }
    async close() {
        if (this.status === browser_status_enum_1.BrowserStatus.UNINITIALIZED) {
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
            this.status = browser_status_enum_1.BrowserStatus.UNINITIALIZED;
            this.lastUsedAt = null;
            this.logger.log(`浏览器实例 ${this.id} 已关闭`);
        }
        catch (error) {
            if (error.message && error.message.includes('Connection closed')) {
                this.logger.warn(`浏览器实例 ${this.id} 连接已关闭，强制清理状态`);
            }
            else {
                this.logger.error(`浏览器实例 ${this.id} 关闭失败: ${error.message}`, error.stack);
            }
            this.page = null;
            this.browser = null;
            this.status = browser_status_enum_1.BrowserStatus.UNINITIALIZED;
            this.lastUsedAt = null;
        }
    }
    getChromiumExecutablePath() {
        const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
        if (envPath) {
            this.logger.debug(`使用环境变量指定的浏览器路径: ${envPath}`);
            return envPath;
        }
        const platform = process.platform;
        const fs = require('fs');
        const chromePaths = {
            darwin: [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium',
                `${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
            ],
            linux: [
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/usr/bin/google-chrome-stable',
                '/usr/bin/google-chrome',
                '/snap/bin/chromium',
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
            }
            catch (error) {
            }
        }
        this.logger.warn('未找到系统 Chrome 路径，将使用 Puppeteer 自带浏览器');
        return undefined;
    }
    parseCookieString(cookieString) {
        const cookies = [];
        const pairs = cookieString.split(';');
        for (const pair of pairs) {
            const trimmed = pair.trim();
            if (!trimmed)
                continue;
            const [name, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=');
            cookies.push({
                name: name.trim(),
                value: value || '',
                domain: '.xiaohongshu.com',
                path: '/',
            });
        }
        return cookies;
    }
}
exports.PuppeteerBrowserInstance = PuppeteerBrowserInstance;
//# sourceMappingURL=browser-instance.puppeteer.js.map