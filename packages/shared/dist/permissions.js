"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.PERMISSIONS = exports.ADMIN_ROLES = void 0;
exports.hasPermission = hasPermission;
exports.ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"];
exports.PERMISSIONS = {
    DASHBOARD_READ: "dashboard.read",
    ADMIN_MANAGE: "admin.manage",
    SCHOLARSHIP_APPROVE: "scholarship.approve",
    SCHOLARSHIP_WRITE: "scholarship.write",
    USER_READ: "user.read",
    USER_SUSPEND: "user.suspend",
    USER_DELETE: "user.delete",
    ORGANIZATION_READ: "organization.read",
    ORGANIZATION_REVIEW: "organization.review",
    APPLICATION_READ: "application.read",
    APPLICATION_REVIEW: "application.review",
    SETTINGS_WRITE: "settings.write",
    CONSULTING_REPLY: "consulting.reply",
    CONTENT_MANAGE: "content.manage",
    NOTIFICATION_READ: "notification.read",
    TRASH_MANAGE: "trash.manage",
    SYSTEM_READ: "system.read",
    REPORT_MANAGE: "report.manage",
    AUDIT_READ: "audit.read",
};
exports.ROLE_PERMISSIONS = {
    SUPER_ADMIN: Object.values(exports.PERMISSIONS),
    ADMIN: [exports.PERMISSIONS.DASHBOARD_READ, exports.PERMISSIONS.SCHOLARSHIP_APPROVE, exports.PERMISSIONS.SCHOLARSHIP_WRITE, exports.PERMISSIONS.USER_READ, exports.PERMISSIONS.USER_SUSPEND, exports.PERMISSIONS.USER_DELETE, exports.PERMISSIONS.ORGANIZATION_READ, exports.PERMISSIONS.ORGANIZATION_REVIEW, exports.PERMISSIONS.APPLICATION_READ, exports.PERMISSIONS.APPLICATION_REVIEW, exports.PERMISSIONS.SETTINGS_WRITE, exports.PERMISSIONS.CONSULTING_REPLY, exports.PERMISSIONS.CONTENT_MANAGE, exports.PERMISSIONS.NOTIFICATION_READ, exports.PERMISSIONS.TRASH_MANAGE, exports.PERMISSIONS.SYSTEM_READ, exports.PERMISSIONS.REPORT_MANAGE, exports.PERMISSIONS.AUDIT_READ],
    MODERATOR: [exports.PERMISSIONS.DASHBOARD_READ, exports.PERMISSIONS.SCHOLARSHIP_APPROVE, exports.PERMISSIONS.SCHOLARSHIP_WRITE, exports.PERMISSIONS.ORGANIZATION_READ, exports.PERMISSIONS.ORGANIZATION_REVIEW],
    SUPPORT: [exports.PERMISSIONS.DASHBOARD_READ, exports.PERMISSIONS.USER_READ, exports.PERMISSIONS.APPLICATION_READ, exports.PERMISSIONS.CONSULTING_REPLY, exports.PERMISSIONS.NOTIFICATION_READ],
};
function hasPermission(role, permission) {
    return exports.ADMIN_ROLES.includes(role) && exports.ROLE_PERMISSIONS[role].includes(permission);
}
//# sourceMappingURL=permissions.js.map