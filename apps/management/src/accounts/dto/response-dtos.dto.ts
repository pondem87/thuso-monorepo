import { Account } from "../entities/account.entity";
import { Invitation } from "../entities/invitation.entity";
import { Permission } from "../entities/permission.entity";
import { User } from "../entities/user.entity";

export class AccountDto {
    id: string;
    name: string;
    root: UserDto | null;
    users: UserDto[];
    createdAt: Date;
    invitations: InvitationDto[];
    maxAllowedBusinesses: number;
    maxAllowedDailyConversations: number;
    subscriptionEndDate: Date
    disabled: boolean

    constructor(account: Account) {
        this.id = account.id;
        this.name = account.name;
        this.root = account.root ? new UserDto(account.root) : null;
        this.users = account.users ? account.users.map(user => new UserDto(user)) : [];
        this.createdAt = account.createdAt;
        this.invitations = account.invitations ? account.invitations.map(invitation => new InvitationDto(invitation)) : [];
        this.maxAllowedBusinesses = account.maxAllowedBusinesses;
        this.maxAllowedDailyConversations = account.maxAllowedDailyConversations;
        this.subscriptionEndDate = account.subscriptionEndDate;
        this.disabled = account.disabled
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

export class InvitationDto {
    id: string
    email: string
    account: Account
    createdAt: Date

    constructor(invitation: Invitation) {
        this.id = invitation.id
        this.email = invitation.email
        this.account = invitation.account
        this.createdAt = invitation.createdAt
    }
}