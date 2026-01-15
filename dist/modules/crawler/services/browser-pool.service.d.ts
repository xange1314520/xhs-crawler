import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PuppeteerBrowserInstance } from './browser-instance.puppeteer';
export declare class BrowserPoolService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private readonly browsers;
    private readonly minSize;
    private readonly maxSize;
    private readonly idleTimeout;
    private waitingQueue;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    initialize(): Promise<void>;
    protected createBrowser(id: string): PuppeteerBrowserInstance;
    getBrowser(accountId: string, cookie: string, timeout?: number): Promise<PuppeteerBrowserInstance>;
    private waitForBrowser;
    private findIdleBrowser;
    releaseBrowser(browserId: string): void;
    getPoolStatus(): {
        totalCapacity: number;
        availableInstances: number;
        inUseInstances: number;
    };
    checkAndRestart(): Promise<void>;
}
