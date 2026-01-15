import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AccountStatus } from '../enums/account-status.enum';
export declare class AccountService {
    private readonly accountRepository;
    constructor(accountRepository: Repository<Account>);
    createAccount(dto: CreateAccountDto): Promise<Account>;
    findAll(filter?: {
        status?: AccountStatus;
    }): Promise<Account[]>;
    findById(id: string): Promise<Account>;
    getAvailableAccount(): Promise<Account>;
    updateAccountUsage(id: string): Promise<void>;
    deleteAccount(id: string): Promise<void>;
}
