import { AccountStatus } from '../enums/account-status.enum';
export declare class AccountResponseDto {
    id: string;
    name: string;
    status: AccountStatus;
    requestCount: number;
    lastUsedAt: Date;
    createdAt: Date;
}
