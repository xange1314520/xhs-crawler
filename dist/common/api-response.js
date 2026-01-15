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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
const swagger_1 = require("@nestjs/swagger");
class ApiResponse {
    constructor(code, message, data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = Date.now();
    }
    static success(data, message = 'success') {
        return new ApiResponse(200, message, data);
    }
    static error(code, message) {
        return new ApiResponse(code, message);
    }
}
exports.ApiResponse = ApiResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态码', example: 200 }),
    __metadata("design:type", Number)
], ApiResponse.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '响应消息', example: 'success' }),
    __metadata("design:type", String)
], ApiResponse.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '响应数据', required: false }),
    __metadata("design:type", Object)
], ApiResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '时间戳', example: 1705132800000 }),
    __metadata("design:type", Number)
], ApiResponse.prototype, "timestamp", void 0);
//# sourceMappingURL=api-response.js.map