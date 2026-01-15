"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserInstance = void 0;
const browser_status_enum_1 = require("../enums/browser-status.enum");
class BrowserInstance {
    constructor(id, mcpClient) {
        this.id = id;
        this.mcpClient = mcpClient;
        this.status = browser_status_enum_1.BrowserStatus.UNINITIALIZED;
        this.initialized = false;
    }
    async launch() {
        if (this.initialized) {
            return;
        }
        try {
            await this.mcpClient.navigate({ url: 'about:blank' });
            this.status = browser_status_enum_1.BrowserStatus.IDLE;
            this.initialized = true;
        }
        catch (error) {
            this.status = browser_status_enum_1.BrowserStatus.ERROR;
            throw error;
        }
    }
    async setCookie(cookie) {
        try {
            await this.mcpClient.evaluate({
                function: `() => { document.cookie = "${cookie}"; }`,
            });
        }
        catch (error) {
            throw error;
        }
    }
    async navigate(url) {
        try {
            this.status = browser_status_enum_1.BrowserStatus.BUSY;
            await this.mcpClient.navigate({ url });
        }
        catch (error) {
            this.status = browser_status_enum_1.BrowserStatus.ERROR;
            throw error;
        }
    }
    async getPageContent() {
        try {
            const snapshot = await this.mcpClient.snapshot();
            return snapshot.html || '';
        }
        catch (error) {
            throw error;
        }
    }
    async close() {
        this.status = browser_status_enum_1.BrowserStatus.UNINITIALIZED;
        this.initialized = false;
    }
    isHealthy() {
        return (this.status === browser_status_enum_1.BrowserStatus.IDLE ||
            this.status === browser_status_enum_1.BrowserStatus.BUSY);
    }
    setIdle() {
        this.status = browser_status_enum_1.BrowserStatus.IDLE;
    }
    setBusy() {
        this.status = browser_status_enum_1.BrowserStatus.BUSY;
    }
}
exports.BrowserInstance = BrowserInstance;
//# sourceMappingURL=browser-instance.js.map