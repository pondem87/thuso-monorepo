import { Account } from "../entities/account.entity";
import { Permission } from "../entities/permission.entity";
import { User } from "../entities/user.entity";

export class AccountDto {
    id: string;
    name: string;
    root: UserDto | null;
    users: UserDto[];
    createdAt: Date;

    constructor(account: Account) {
        this.id = account.id;
        this.name = account.name;
        this.root = account.root ? new UserDto(account.root) : null;
        this.users = account.users ? account.users.map(user => new UserDto(user)) : [];
        this.createdAt = account.createdAt;
    }
}

export class UserDto {
    id: string;
    email: string;
    forenames: string;
    surname: string;
    verified: boolean;
    createdAt: Date;
    rootOf?: AccountDto;
    permissions?: PermissionDto[];
    accounts?: AccountDto[];

    constructor(user: User) {
        this.id = user.id;
        this.email = user.email;
        this.forenames = user.forenames;
        this.surname = user.surname;
        this.verified = user.verified;
        this.createdAt = user.createdAt;
        
        if (user.rootOf) {
            this.rootOf = new AccountDto(user.rootOf);
        }
        if (user.permissions) {
            this.permissions = user.permissions.map(permission => new PermissionDto(permission));
        }
        if (user.accounts) {
            this.accounts = user.accounts.map(account => new AccountDto(account));
        }
    }
}

export class PermissionDto {
    id: number;
    accountId: string;
    entity: string;
    action: string;

    constructor(permission: Permission) {
        this.id = permission.id;
        this.accountId = permission.accountId;
        this.entity = permission.entity;
        this.action = permission.action;
    }
}