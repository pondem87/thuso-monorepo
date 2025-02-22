export enum PermissionAction {
    READ = "read",
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete"
}

export type PermissionType = {
    entity: "account" | "invitation" | "permission" | "user" | "whatsapp_business" | "business_profile" | "whatsapp_number" | "document" | "product",
    action: PermissionAction
}