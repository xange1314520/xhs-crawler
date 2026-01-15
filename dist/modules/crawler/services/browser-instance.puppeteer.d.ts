import { BrowserStatus } from '../enums/browser-status.enum';
export declare class PuppeteerBrowserInstance {
    readonly id: string;
    private status;
    private lastUsedAt;
    private readonly logger;
    private browser;
    private page;
    constructor(id?: string);
    getStatus(): BrowserStatus;
    getLastUsedAt(): Date | null;
    isHealthy(): boolean;
    setIdle(): void;
    setBusy(): void;
    launch(): Promise<void>;
    setCookie(cookieString: string): Promise<void>;
    navigate(url: string, timeout?: number): Promise<void>;
    getPageContent(selector?: string, timeout?: number): Promise<string>;
    evaluate<T = any>(script: string | (() => any), timeout?: number): Promise<T>;
    close(): Promise<void>;
    private getChromiumExecutablePath;
    private parseCookieString;
}
