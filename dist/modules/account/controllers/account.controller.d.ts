import { AccountService } from '../services/account.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AccountResponseDto } from '../dto/account-response.dto';
import { ApiResponse } from '../../../common/api-response';
export declare class AccountController {
    private readonly accountService;
    constructor(accountService: AccountService);
    createAccount(dto: CreateAccountDto): Promise<ApiResponse<AccountResponseDto>>;
    getAccounts(status?: string): Promise<ApiResponse<AccountResponseDto[]>>;
    deleteAccount(id: string): Promise<ApiResponse>;
}
