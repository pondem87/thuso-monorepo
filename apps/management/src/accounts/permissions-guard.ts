import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { Logger } from 'winston';
import { LoggingService } from '@lib/logging';
import { Reflector } from '@nestjs/core';
import { PermissionsDecorator } from './permissions.decorator';
import { User } from './entities/user.entity';
import { PermissionType } from './types';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {

    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly reflector: Reflector
    ) {
        this.logger = this.loggingService.getLogger({
            module: "PermissionsGuard",
            file: "permissions-guard"
        })

        this.logger.info("Init PermissionGuard")
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        this.logger.debug("Permissions Guard executed", { url: request.url })

        const permissions = this.reflector.get(PermissionsDecorator, context.getHandler())
        this.logger.debug("User object on request", { user: request.user })
        this.logger.debug("Required permissions", { permissions })

        if (!permissions) {
            return true;
        }

        const { user }: { user: User } = request
        const accountId = request.params["account"]

        if (!user || !user.verified) {
            this.logger.debug("Access denied: No user found or user is not verified");
            return false;
        }

        // if user is root user of the account has all permissions
        if (user.rootOf?.id === accountId) {
            return true
        }

        if (!user.permissions || user.permissions.length === 0) {
            this.logger.debug("Access denied: User has no permissions", { email: user.email });
            return false;
        }

        const hasPermission = matchPermissions(accountId, permissions, user.permissions);

        if (!hasPermission) {
            this.logger.debug("Access denied", { email: user.email, accountId });
        }

        return hasPermission;
    }

}

function matchPermissions(accountId: string, permissions: PermissionType[], userPermissions: Permission[]): boolean {
    return permissions.every((permission) => {
        return userPermissions.some((userPermission) => {
            return compare(accountId, permission, userPermission)
        })
    })
}

function compare(accountId: string, permission: PermissionType, userPermission: Permission): boolean {
    return accountId === userPermission.accountId && permission.entity === userPermission.entity && permission.action === userPermission.action
}