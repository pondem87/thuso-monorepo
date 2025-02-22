import { Reflector } from '@nestjs/core';
import { PermissionType } from './types';

export const PermissionsDecorator = Reflector.createDecorator<PermissionType[]>();