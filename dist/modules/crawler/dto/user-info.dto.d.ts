export declare class UserInfoDto {
    userId: string;
    nickname: string;
    ipLocation: string;
    fansCount: number;
    followCount: number;
    likeCollectCount: number;
    noteCount: number;
    tags: string[];
    crawlTime: Date;
}
export declare class CrawlUserRequestDto {
    userIdOrUrl: string;
}
export declare class BatchCrawlUserItem {
    userIdOrUrl: string;
}
export declare class BatchCrawlUserDto {
    users: BatchCrawlUserItem[];
}
