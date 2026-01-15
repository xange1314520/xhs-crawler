import { BrowserPoolService } from './browser-pool.service';
export declare class HealthCheckScheduler {
    private readonly browserPoolService;
    private readonly logger;
    constructor(browserPoolService: BrowserPoolService);
    handleHealthCheck(): Promise<void>;
}
