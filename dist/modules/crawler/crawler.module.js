"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const browser_pool_service_1 = require("./services/browser-pool.service");
const health_check_scheduler_1 = require("./services/health-check.scheduler");
const parser_service_1 = require("./services/parser.service");
const crawler_service_1 = require("./services/crawler.service");
const crawler_controller_1 = require("./controllers/crawler.controller");
const user_crawler_controller_1 = require("./controllers/user-crawler.controller");
const account_module_1 = require("../account/account.module");
let CrawlerModule = class CrawlerModule {
};
exports.CrawlerModule = CrawlerModule;
exports.CrawlerModule = CrawlerModule = __decorate([
    (0, common_1.Module)({
        imports: [schedule_1.ScheduleModule.forRoot(), account_module_1.AccountModule],
        controllers: [crawler_controller_1.CrawlerController, user_crawler_controller_1.UserCrawlerController],
        providers: [
            browser_pool_service_1.BrowserPoolService,
            health_check_scheduler_1.HealthCheckScheduler,
            parser_service_1.ParserService,
            crawler_service_1.CrawlerService,
        ],
        exports: [browser_pool_service_1.BrowserPoolService, crawler_service_1.CrawlerService],
    })
], CrawlerModule);
//# sourceMappingURL=crawler.module.js.map