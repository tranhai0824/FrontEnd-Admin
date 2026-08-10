export declare const SYSTEM_SETTING_GROUPS: readonly [{
    readonly id: "general";
    readonly label: "Thương hiệu & pháp lý";
    readonly description: "Nhận diện website, pháp nhân, liên hệ và footer.";
}, {
    readonly id: "localization";
    readonly label: "Bản địa hóa";
    readonly description: "Múi giờ, định dạng, tiền tệ, ngôn ngữ và ngày lễ.";
}, {
    readonly id: "accounts";
    readonly label: "Tài khoản & đăng ký";
    readonly description: "Đăng ký, phương thức đăng nhập, xác minh và hồ sơ.";
}, {
    readonly id: "security";
    readonly label: "Bảo mật & phiên";
    readonly description: "Mật khẩu, token, phiên, 2FA, CAPTCHA, CORS và rate limit.";
}, {
    readonly id: "storage";
    readonly label: "Tải lên & lưu trữ";
    readonly description: "Giới hạn file, MIME, signed URL, antivirus, ảnh và CDN.";
}, {
    readonly id: "scholarships";
    readonly label: "Học bổng & kiểm duyệt";
    readonly description: "Tổ chức tin cậy, SLA, kiểm duyệt, hết hạn và nổi bật.";
}, {
    readonly id: "applications";
    readonly label: "Hồ sơ ứng tuyển";
    readonly description: "Hạn mức, gian lận, deadline, tài liệu và GPA.";
}, {
    readonly id: "kyc";
    readonly label: "Tổ chức & KYC";
    readonly description: "Giấy tờ, SLA, mã số thuế, tái xác minh và risk score.";
}, {
    readonly id: "support";
    readonly label: "Tư vấn & hỗ trợ";
    readonly description: "Giờ làm việc, SLA, phân công, auto-close và CSAT.";
}, {
    readonly id: "notifications";
    readonly label: "Email & thông báo";
    readonly description: "Nhà cung cấp, sender, ma trận kênh, sandbox và retry.";
}, {
    readonly id: "seo";
    readonly label: "SEO & Analytics";
    readonly description: "Metadata, canonical, robots, sitemap, tracking và redirect.";
}];
export type SystemSettingGroup = (typeof SYSTEM_SETTING_GROUPS)[number]["id"];
export type SystemSettingPriority = "P0" | "P1" | "P2";
export type SystemSettingFieldType = "text" | "textarea" | "number" | "boolean" | "select" | "list" | "json" | "email" | "url" | "color" | "secret";
export type SystemSettingValue = string | number | boolean | string[] | Record<string, unknown> | unknown[];
export interface SystemSettingOption {
    label: string;
    value: string;
}
export interface SystemSettingDefinition {
    key: string;
    group: SystemSettingGroup;
    label: string;
    priority: SystemSettingPriority;
    type: SystemSettingFieldType;
    defaultValue: SystemSettingValue;
    description?: string;
    placeholder?: string;
    options?: readonly SystemSettingOption[];
    min?: number;
    max?: number;
    integer?: boolean;
    secret?: boolean;
}
export declare const SYSTEM_SETTING_DEFINITIONS: readonly SystemSettingDefinition[];
export declare function getSystemSettingDefinition(key: string): SystemSettingDefinition | undefined;
export declare function getSystemSettingDefinitions(group?: SystemSettingGroup): SystemSettingDefinition[];
export declare function isSystemSettingGroup(value: string): value is SystemSettingGroup;
export declare function validateSystemSettingValue(definition: SystemSettingDefinition, value: unknown): string | null;
export declare function getSystemSettingDefaults(group?: SystemSettingGroup): Record<string, SystemSettingValue>;
export declare const SENSITIVE_SYSTEM_SETTING_KEYS: string[];
