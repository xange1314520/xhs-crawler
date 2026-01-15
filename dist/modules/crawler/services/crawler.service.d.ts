import { BrowserPoolService } from './browser-pool.service';
import { AccountService } from '../../account/services/account.service';
import { ParserService } from './parser.service';
import { PostDetailDto } from '../dto/post-detail.dto';
import { UserInfoDto } from '../dto/user-info.dto';
export declare class CrawlerService {
    private readonly browserPoolService;
    private readonly accountService;
    private readonly parserService;
    private readonly logger;
    constructor(browserPoolService: BrowserPoolService, accountService: AccountService, parserService: ParserService);
    crawlPost(postId: string, xsecToken: string): Promise<PostDetailDto>;
    crawlBatch(posts: Array<{
        postId: string;
        xsecToken: string;
    }>): Promise<Array<{
        postId: string;
        success: boolean;
        data?: PostDetailDto;
        error?: string;
    }>>;
    private processUserUrl;
    crawlUser(userIdOrUrl: string): Promise<UserInfoDto>;
    crawlUserBatch(users: Array<{
        userIdOrUrl: string;
    }>): Promise<Array<{
        userIdOrUrl: string;
        success: boolean;
        data?: UserInfoDto;
        error?: string;
    }>>;
}
