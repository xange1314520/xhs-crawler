import { AccountStatus } from '../enums/account-status.enum';
export declare class Account {
    id: string;
    name: string;
    cookie: string;
    status: AccountStatus;
    requestCount: number;
    lastUsedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
