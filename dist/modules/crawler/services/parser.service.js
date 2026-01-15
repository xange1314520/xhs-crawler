"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserService = void 0;
const common_1 = require("@nestjs/common");
let ParserService = ParserService_1 = class ParserService {
    constructor() {
        this.logger = new common_1.Logger(ParserService_1.name);
    }
    parsePostDetail(postId, html) {
        try {
            const jsonData = this.extractJsonData(html);
            if (jsonData) {
                return this.parseFromJson(postId, jsonData);
            }
            return this.parseFromDom(postId, html);
        }
        catch (error) {
            this.logger.error(`解析帖子详情失败: ${postId}`, error);
            return {
                postId,
                title: '',
                likeCount: 0,
                collectCount: 0,
                commentCount: 0,
                shareCount: 0,
                crawlTime: new Date(),
            };
        }
    }
    parseFromJson(postId, jsonData) {
        const note = jsonData.note || {};
        const interactInfo = note.interactInfo || {};
        return {
            postId,
            title: note.title || '',
            likeCount: this.extractNumber(interactInfo.likedCount),
            collectCount: this.extractNumber(interactInfo.collectedCount),
            commentCount: this.extractNumber(interactInfo.commentCount),
            shareCount: this.extractNumber(interactInfo.shareCount),
            crawlTime: new Date(),
        };
    }
    parseFromDom(postId, html) {
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace(' - 小红书', '').trim() : '';
        const likeMatch = html.match(/class="like-count"[^>]*data-count="(\d+)"/i);
        const likeCount = likeMatch ? parseInt(likeMatch[1], 10) : 0;
        const collectMatch = html.match(/class="collect-count"[^>]*data-count="(\d+)"/i);
        const collectCount = collectMatch ? parseInt(collectMatch[1], 10) : 0;
        const commentMatch = html.match(/class="comment-count"[^>]*data-count="(\d+)"/i);
        const commentCount = commentMatch ? parseInt(commentMatch[1], 10) : 0;
        const shareMatch = html.match(/class="share-count"[^>]*data-count="(\d+)"/i);
        const shareCount = shareMatch ? parseInt(shareMatch[1], 10) : 0;
        return {
            postId,
            title,
            likeCount,
            collectCount,
            commentCount,
            shareCount,
            crawlTime: new Date(),
        };
    }
    extractJsonData(html) {
        try {
            const match = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
            if (match && match[1]) {
                return JSON.parse(match[1]);
            }
            return null;
        }
        catch (error) {
            this.logger.warn('提取JSON数据失败，降级到DOM解析');
            return null;
        }
    }
    extractNumber(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        if (typeof value === 'number') {
            return value;
        }
        const str = String(value).replace(/,/g, '');
        const num = parseInt(str, 10);
        return isNaN(num) ? 0 : num;
    }
};
exports.ParserService = ParserService;
exports.ParserService = ParserService = ParserService_1 = __decorate([
    (0, common_1.Injectable)()
], ParserService);
//# sourceMappingURL=parser.service.js.map