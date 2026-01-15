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
var HealthCheckScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const browser_pool_service_1 = require("./browser-pool.service");
let HealthCheckScheduler = HealthCheckScheduler_1 = class HealthCheckScheduler {
    constructor(browserPoolService) {
        this.browserPoolService = browserPoolService;
        this.logger = new common_1.Logger(HealthCheckScheduler_1.name);
    }
    async handleHealthCheck() {
        try {
            this.logger.log('开始浏览器连接池健康检查...');
            await this.browserPoolService.checkAndRestart();
            this.logger.log('健康检查完成');
        }
        catch (error) {
            this.logger.error('健康检查失败:', error);
        }
    }
};
exports.HealthCheckScheduler = HealthCheckScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthCheckScheduler.prototype, "handleHealthCheck", null);
exports.HealthCheckScheduler = HealthCheckScheduler = HealthCheckScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [browser_pool_service_1.BrowserPoolService])
], HealthCheckScheduler);
//# sourceMappingURL=health-check.scheduler.js.map