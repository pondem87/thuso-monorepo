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

/*
*   PermissionsGuard is a NestJS guard that checks if the user has the required permissions
*   to access a specific route. It uses the PermissionsDecorator to get the required permissions
*   for the route and compares them with the user's permissions.
*/

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

        // get the permissions required for the route from the PermissionsDecorator
        const permissions = this.reflector.get(PermissionsDecorator, context.getHandler())
        this.logger.debug("User object on request", { user: request.user })
        this.logger.debug("Required permissions", { permissions })

        // If no permissions are required, allow access to all requests
        if (!permissions) {
            return true;
        }

        const { user }: { user: User } = request
        const accountId = request.params["account"]

        // If no user is found, or the user is not verified, deny access
        if (!user || !user.verified) {
            this.logger.debug("Access denied: No user found or user is not verified");
            return false;
        }

        // if user is root user of the account then allow access to all requests
        if (user.rootOf?.id === accountId) {
            return true
        }

        // if user is not part of the account, deny access
        if (!user.accounts || !user.accounts.some(account => account.id === accountId)) {
            this.logger.debug("Access denied: User is not part of the account", { email: user.email, accountId });
            return false;
        }

        // If the user has no permissions, deny access
        if (!user.permissions || user.permissions.length === 0) {
            this.logger.debug("Access denied: User has no permissions", { email: user.email });
            return false;
        }

        // Check if the user has the required permissions for the account and the route
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