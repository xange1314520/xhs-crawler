import { CrawlerService } from '../services/crawler.service';
import { UserInfoDto, CrawlUserRequestDto, BatchCrawlUserDto } from '../dto/user-info.dto';
import { ApiResponse } from '../../../common/api-response';
export declare class UserCrawlerController {
    private readonly crawlerService;
    constructor(crawlerService: CrawlerService);
    crawlUser(dto: CrawlUserRequestDto): Promise<ApiResponse<UserInfoDto>>;
    crawlUserBatch(dto: BatchCrawlUserDto): Promise<ApiResponse<any[]>>;
}
