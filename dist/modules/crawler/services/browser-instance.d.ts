import { BrowserStatus } from '../enums/browser-status.enum';
export declare class BrowserInstance {
    readonly id: string;
    private readonly mcpClient;
    status: BrowserStatus;
    private initialized;
    constructor(id: string, mcpClient: any);
    launch(): Promise<void>;
    setCookie(cookie: string): Promise<void>;
    navigate(url: string): Promise<void>;
    getPageContent(): Promise<string>;
    close(): Promise<void>;
    isHealthy(): boolean;
    setIdle(): void;
    setBusy(): void;
}
