import { CrawlerService } from '../services/crawler.service';
import { PostDetailDto } from '../dto/post-detail.dto';
import { BatchCrawlDto } from '../dto/batch-crawl.dto';
import { ApiResponse } from '../../../common/api-response';
export declare class CrawlerController {
    private readonly crawlerService;
    constructor(crawlerService: CrawlerService);
    crawlPost(postId: string, xsecToken: string): Promise<ApiResponse<PostDetailDto>>;
    crawlBatch(dto: BatchCrawlDto): Promise<ApiResponse<any[]>>;
}
