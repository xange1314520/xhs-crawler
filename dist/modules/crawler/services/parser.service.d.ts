import { PostDetailDto } from '../dto/post-detail.dto';
export declare class ParserService {
    private readonly logger;
    parsePostDetail(postId: string, html: string): PostDetailDto;
    private parseFromJson;
    private parseFromDom;
    private extractJsonData;
    extractNumber(value: any): number;
}
