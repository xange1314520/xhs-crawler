export declare class ApiResponse<T = any> {
    code: number;
    message: string;
    data?: T;
    timestamp: number;
    constructor(code: number, message: string, data?: T);
    static success<T>(data?: T, message?: string): ApiResponse<T>;
    static error(code: number, message: string): ApiResponse;
}
