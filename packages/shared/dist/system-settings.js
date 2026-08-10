"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SENSITIVE_SYSTEM_SETTING_KEYS = exports.SYSTEM_SETTING_DEFINITIONS = exports.SYSTEM_SETTING_GROUPS = void 0;
exports.getSystemSettingDefinition = getSystemSettingDefinition;
exports.getSystemSettingDefinitions = getSystemSettingDefinitions;
exports.isSystemSettingGroup = isSystemSettingGroup;
exports.validateSystemSettingValue = validateSystemSettingValue;
exports.getSystemSettingDefaults = getSystemSettingDefaults;
exports.SYSTEM_SETTING_GROUPS = [
    { id: "general", label: "Thương hiệu & pháp lý", description: "Nhận diện website, pháp nhân, liên hệ và footer." },
    { id: "localization", label: "Bản địa hóa", description: "Múi giờ, định dạng, tiền tệ, ngôn ngữ và ngày lễ." },
    { id: "accounts", label: "Tài khoản & đăng ký", description: "Đăng ký, phương thức đăng nhập, xác minh và hồ sơ." },
    { id: "security", label: "Bảo mật & phiên", description: "Mật khẩu, token, phiên, 2FA, CAPTCHA, CORS và rate limit." },
    { id: "storage", label: "Tải lên & lưu trữ", description: "Giới hạn file, MIME, signed URL, antivirus, ảnh và CDN." },
    { id: "scholarships", label: "Học bổng & kiểm duyệt", description: "Tổ chức tin cậy, SLA, kiểm duyệt, hết hạn và nổi bật." },
    { id: "applications", label: "Hồ sơ ứng tuyển", description: "Hạn mức, gian lận, deadline, tài liệu và GPA." },
    { id: "kyc", label: "Tổ chức & KYC", description: "Giấy tờ, SLA, mã số thuế, tái xác minh và risk score." },
    { id: "support", label: "Tư vấn & hỗ trợ", description: "Giờ làm việc, SLA, phân công, auto-close và CSAT." },
    { id: "notifications", label: "Email & thông báo", description: "Nhà cung cấp, sender, ma trận kênh, sandbox và retry." },
    { id: "seo", label: "SEO & Analytics", description: "Metadata, canonical, robots, sitemap, tracking và redirect." },
];
const option = (value, label = value) => ({ value, label });
const field = (group, input) => ({ group, ...input });
const general = [
    field("general", { key: "site.name", label: "Tên site", priority: "P0", type: "text", defaultValue: "TopScholar" }),
    field("general", { key: "site.tagline", label: "Tagline", priority: "P0", type: "text", defaultValue: "Cổng học bổng dành cho bạn" }),
    field("general", { key: "site.shortDescription", label: "Mô tả ngắn", priority: "P0", type: "textarea", defaultValue: "Nền tảng kết nối ứng viên với các cơ hội học bổng uy tín." }),
    field("general", { key: "brand.logoLightUrl", label: "Logo nền sáng", priority: "P0", type: "url", defaultValue: "" }),
    field("general", { key: "brand.logoDarkUrl", label: "Logo nền tối", priority: "P0", type: "url", defaultValue: "" }),
    field("general", { key: "brand.faviconUrl", label: "Favicon", priority: "P0", type: "url", defaultValue: "" }),
    field("general", { key: "brand.emailLogoUrl", label: "Logo email", priority: "P0", type: "url", defaultValue: "" }),
    field("general", { key: "brand.defaultOgImageUrl", label: "OG image mặc định", priority: "P0", type: "url", defaultValue: "" }),
    field("general", { key: "theme.primaryColor", label: "Màu chủ đạo", priority: "P1", type: "color", defaultValue: "#0866FF" }),
    field("general", { key: "theme.secondaryColor", label: "Màu phụ", priority: "P1", type: "color", defaultValue: "#0F172A" }),
    field("general", { key: "theme.borderRadiusPx", label: "Bo góc mặc định (px)", priority: "P1", type: "number", defaultValue: 12, min: 0, max: 40, integer: true }),
    field("general", { key: "legal.entityName", label: "Tên pháp nhân", priority: "P0", type: "text", defaultValue: "" }),
    field("general", { key: "legal.taxCode", label: "Mã số thuế", priority: "P0", type: "text", defaultValue: "" }),
    field("general", { key: "legal.address", label: "Địa chỉ pháp lý", priority: "P0", type: "textarea", defaultValue: "" }),
    field("general", { key: "contact.hotline", label: "Hotline", priority: "P0", type: "text", defaultValue: "" }),
    field("general", { key: "contact.supportEmail", label: "Email hỗ trợ", priority: "P0", type: "email", defaultValue: "support@topscholar.vn" }),
    field("general", { key: "contact.noReplyEmail", label: "Email no-reply", priority: "P0", type: "email", defaultValue: "no-reply@topscholar.vn" }),
    field("general", { key: "contact.businessHours", label: "Giờ làm việc", priority: "P0", type: "text", defaultValue: "Thứ Hai–Thứ Sáu, 08:00–17:30" }),
    field("general", { key: "legal.ecommerceLicense", label: "Số giấy phép / thông báo Bộ Công Thương", priority: "P0", type: "text", defaultValue: "" }),
    field("general", { key: "social.facebookUrl", label: "Facebook", priority: "P1", type: "url", defaultValue: "" }),
    field("general", { key: "social.youtubeUrl", label: "YouTube", priority: "P1", type: "url", defaultValue: "" }),
    field("general", { key: "social.tiktokUrl", label: "TikTok", priority: "P1", type: "url", defaultValue: "" }),
    field("general", { key: "social.zaloUrl", label: "Zalo OA", priority: "P1", type: "url", defaultValue: "" }),
    field("general", { key: "social.linkedinUrl", label: "LinkedIn", priority: "P1", type: "url", defaultValue: "" }),
    field("general", { key: "footer.content", label: "Nội dung footer", priority: "P1", type: "textarea", defaultValue: "" }),
    field("general", { key: "footer.copyright", label: "Copyright", priority: "P1", type: "text", defaultValue: "© 2026 TopScholar. All rights reserved." }),
];
const localization = [
    field("localization", { key: "localization.timezone", label: "Múi giờ mặc định", priority: "P0", type: "select", defaultValue: "Asia/Ho_Chi_Minh", options: [option("Asia/Ho_Chi_Minh", "Asia/Ho_Chi_Minh (UTC+7)"), option("UTC")] }),
    field("localization", { key: "localization.dateFormat", label: "Định dạng ngày", priority: "P1", type: "select", defaultValue: "dd/MM/yyyy", options: [option("dd/MM/yyyy"), option("MM/dd/yyyy"), option("yyyy-MM-dd")] }),
    field("localization", { key: "localization.timeFormat", label: "Định dạng giờ", priority: "P1", type: "select", defaultValue: "HH:mm", options: [option("HH:mm", "24 giờ"), option("hh:mm a", "12 giờ")] }),
    field("localization", { key: "localization.weekStartsOn", label: "Ngày đầu tuần", priority: "P1", type: "select", defaultValue: "MONDAY", options: [option("MONDAY", "Thứ Hai"), option("SUNDAY", "Chủ Nhật")] }),
    field("localization", { key: "localization.numberLocale", label: "Định dạng số", priority: "P1", type: "select", defaultValue: "vi-VN", options: [option("vi-VN"), option("en-US"), option("en-GB")] }),
    field("localization", { key: "currency.default", label: "Tiền tệ mặc định", priority: "P0", type: "select", defaultValue: "VND", options: ["VND", "USD", "EUR", "AUD", "GBP", "JPY", "KRW", "CAD", "SGD"].map((value) => option(value)) }),
    field("localization", { key: "currency.allowed", label: "Tiền tệ cho phép", priority: "P0", type: "list", defaultValue: ["VND", "USD", "EUR", "AUD"] }),
    field("localization", { key: "exchangeRate.provider", label: "Nguồn tỷ giá", priority: "P1", type: "select", defaultValue: "MANUAL", options: [option("MANUAL", "Nhập thủ công"), option("OPEN_EXCHANGE_RATES"), option("EXCHANGE_RATE_API")] }),
    field("localization", { key: "exchangeRate.updateHours", label: "Tần suất cập nhật tỷ giá (giờ)", priority: "P1", type: "number", defaultValue: 24, min: 1, max: 168, integer: true }),
    field("localization", { key: "language.default", label: "Ngôn ngữ mặc định", priority: "P2", type: "select", defaultValue: "vi", options: [option("vi", "Tiếng Việt"), option("en", "English")] }),
    field("localization", { key: "language.enabled", label: "Ngôn ngữ đang bật", priority: "P2", type: "list", defaultValue: ["vi"] }),
    field("localization", { key: "holidays.vn", label: "Danh sách ngày lễ Việt Nam", priority: "P1", type: "json", defaultValue: [], description: "Mảng JSON: [{\"date\":\"2026-09-02\",\"name\":\"Quốc khánh\"}]." }),
];
const accounts = [
    field("accounts", { key: "registration.enabled", label: "Cho phép đăng ký mới", priority: "P0", type: "boolean", defaultValue: true }),
    field("accounts", { key: "auth.providers", label: "Phương thức đăng nhập", priority: "P0", type: "list", defaultValue: ["EMAIL"], description: "EMAIL, GOOGLE, FACEBOOK, ZALO, APPLE." }),
    field("accounts", { key: "verification.emailRequired", label: "Bắt buộc xác minh email", priority: "P0", type: "boolean", defaultValue: true }),
    field("accounts", { key: "verification.phoneRequired", label: "Bắt buộc xác minh số điện thoại", priority: "P1", type: "boolean", defaultValue: false }),
    field("accounts", { key: "token.emailVerificationTtlMinutes", label: "TTL email xác minh (phút)", priority: "P0", type: "number", defaultValue: 30, min: 5, max: 1440, integer: true }),
    field("accounts", { key: "token.passwordResetTtlMinutes", label: "TTL đặt lại mật khẩu (phút)", priority: "P0", type: "number", defaultValue: 30, min: 5, max: 1440, integer: true }),
    field("accounts", { key: "token.otpTtlMinutes", label: "TTL OTP (phút)", priority: "P0", type: "number", defaultValue: 5, min: 1, max: 30, integer: true }),
    field("accounts", { key: "otp.maxResends", label: "Số lần gửi lại OTP", priority: "P0", type: "number", defaultValue: 5, min: 1, max: 20, integer: true }),
    field("accounts", { key: "otp.resendCooldownSeconds", label: "Cooldown gửi lại OTP (giây)", priority: "P0", type: "number", defaultValue: 60, min: 15, max: 3600, integer: true }),
    field("accounts", { key: "email.blockedDomains", label: "Domain email bị chặn", priority: "P1", type: "list", defaultValue: [] }),
    field("accounts", { key: "email.allowedDomains", label: "Domain email được phép", priority: "P1", type: "list", defaultValue: [] }),
    field("accounts", { key: "registration.minimumAge", label: "Tuổi tối thiểu", priority: "P1", type: "number", defaultValue: 13, min: 0, max: 100, integer: true }),
    field("accounts", { key: "account.selfDeleteEnabled", label: "Cho phép tự xóa tài khoản", priority: "P1", type: "boolean", defaultValue: true }),
    field("accounts", { key: "account.deleteGraceDays", label: "Thời gian chờ xóa (ngày)", priority: "P1", type: "number", defaultValue: 30, min: 0, max: 365, integer: true }),
    field("accounts", { key: "profile.requiredFields", label: "Trường hồ sơ bắt buộc", priority: "P1", type: "list", defaultValue: ["fullName", "phone", "educationLevel", "country"] }),
    field("accounts", { key: "profile.minimumCompletionPercent", label: "Mức hoàn thiện tối thiểu để nộp (%)", priority: "P2", type: "number", defaultValue: 70, min: 0, max: 100, integer: true }),
];
const security = [
    field("security", { key: "password.minLength", label: "Độ dài mật khẩu tối thiểu", priority: "P0", type: "number", defaultValue: 12, min: 8, max: 128, integer: true }),
    field("security", { key: "password.requireUppercase", label: "Yêu cầu chữ hoa", priority: "P0", type: "boolean", defaultValue: true }),
    field("security", { key: "password.requireLowercase", label: "Yêu cầu chữ thường", priority: "P0", type: "boolean", defaultValue: true }),
    field("security", { key: "password.requireNumber", label: "Yêu cầu chữ số", priority: "P0", type: "boolean", defaultValue: true }),
    field("security", { key: "password.requireSymbol", label: "Yêu cầu ký hiệu", priority: "P0", type: "boolean", defaultValue: true }),
    field("security", { key: "password.historyCount", label: "Không dùng lại N mật khẩu gần nhất", priority: "P1", type: "number", defaultValue: 5, min: 0, max: 24, integer: true }),
    field("security", { key: "password.hibpEnabled", label: "Kiểm tra mật khẩu đã rò rỉ", priority: "P1", type: "boolean", defaultValue: false }),
    field("security", { key: "password.adminExpiryDays", label: "Chu kỳ đổi mật khẩu admin (ngày)", priority: "P2", type: "number", defaultValue: 0, min: 0, max: 365, integer: true }),
    field("security", { key: "token.accessTtlMinutes", label: "TTL access token (phút)", priority: "P0", type: "number", defaultValue: 15, min: 5, max: 60, integer: true }),
    field("security", { key: "token.refreshTtlDays", label: "TTL refresh token (ngày)", priority: "P0", type: "number", defaultValue: 7, min: 1, max: 90, integer: true }),
    field("security", { key: "session.idleTimeoutMinutes", label: "Idle timeout (phút)", priority: "P0", type: "number", defaultValue: 30, min: 5, max: 1440, integer: true }),
    field("security", { key: "session.absoluteLifetimeHours", label: "Tuổi thọ phiên tuyệt đối (giờ)", priority: "P0", type: "number", defaultValue: 24, min: 1, max: 720, integer: true }),
    field("security", { key: "session.maxConcurrent", label: "Số phiên đồng thời tối đa", priority: "P1", type: "number", defaultValue: 5, min: 1, max: 50, integer: true }),
    field("security", { key: "login.maxFailures", label: "Số lần sai trước khi khóa", priority: "P0", type: "number", defaultValue: 5, min: 3, max: 20, integer: true }),
    field("security", { key: "login.lockMinutes", label: "Thời gian khóa (phút)", priority: "P0", type: "number", defaultValue: 15, min: 1, max: 1440, integer: true }),
    field("security", { key: "captcha.failureThreshold", label: "Ngưỡng bật CAPTCHA", priority: "P0", type: "number", defaultValue: 3, min: 1, max: 20, integer: true }),
    field("security", { key: "twoFactor.modeByRole", label: "Chính sách 2FA theo vai trò", priority: "P0", type: "json", defaultValue: { SUPER_ADMIN: "REQUIRED", ADMIN: "REQUIRED", MODERATOR: "OPTIONAL", SUPPORT: "OPTIONAL" } }),
    field("security", { key: "twoFactor.recoveryCodeCount", label: "Số recovery code", priority: "P0", type: "number", defaultValue: 10, min: 5, max: 20, integer: true }),
    field("security", { key: "stepUp.actions", label: "Hành động yêu cầu xác thực lại", priority: "P0", type: "list", defaultValue: ["USER_DELETE", "ROLE_CHANGE", "PII_EXPORT", "SYSTEM_SETTINGS", "MAINTENANCE_ENABLE"] }),
    field("security", { key: "admin.ipAllowlist", label: "IP allowlist admin", priority: "P1", type: "list", defaultValue: [] }),
    field("security", { key: "cors.origins", label: "CORS origins", priority: "P0", type: "list", defaultValue: ["http://localhost:3000", "http://localhost:3001"] }),
    field("security", { key: "rateLimit.groups", label: "Rate limit theo nhóm endpoint", priority: "P0", type: "json", defaultValue: { auth: { limit: 10, windowSeconds: 60 }, upload: { limit: 20, windowSeconds: 60 }, search: { limit: 120, windowSeconds: 60 }, public: { limit: 300, windowSeconds: 60 } } }),
    field("security", { key: "recaptcha.siteKey", label: "reCAPTCHA site key", priority: "P0", type: "text", defaultValue: "" }),
    field("security", { key: "recaptcha.secretKey", label: "reCAPTCHA secret", priority: "P0", type: "secret", defaultValue: "", secret: true }),
    field("security", { key: "recaptcha.scoreThreshold", label: "Ngưỡng reCAPTCHA score", priority: "P0", type: "number", defaultValue: 0.5, min: 0, max: 1 }),
    field("security", { key: "security.newDeviceLoginAlert", label: "Cảnh báo thiết bị/IP mới", priority: "P1", type: "boolean", defaultValue: true }),
];
const storage = [
    ...[
        ["avatar", "Avatar", 5],
        ["applicationDocument", "Tài liệu hồ sơ", 20],
        ["kycDocument", "Giấy tờ KYC", 20],
        ["postImage", "Ảnh bài viết", 10],
        ["banner", "Banner", 15],
    ].map(([key, label, defaultValue]) => field("storage", { key: `upload.maxMb.${key}`, label: `Dung lượng tối đa: ${label} (MB)`, priority: "P0", type: "number", defaultValue: defaultValue, min: 1, max: 100, integer: true })),
    field("storage", { key: "upload.rules.avatar", label: "Extension/MIME avatar", priority: "P0", type: "json", defaultValue: { extensions: ["jpg", "jpeg", "png", "webp"], mimeTypes: ["image/jpeg", "image/png", "image/webp"] } }),
    field("storage", { key: "upload.rules.applicationDocument", label: "Extension/MIME tài liệu hồ sơ", priority: "P0", type: "json", defaultValue: { extensions: ["pdf", "doc", "docx"], mimeTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] } }),
    field("storage", { key: "upload.rules.kycDocument", label: "Extension/MIME KYC", priority: "P0", type: "json", defaultValue: { extensions: ["pdf", "jpg", "jpeg", "png"], mimeTypes: ["application/pdf", "image/jpeg", "image/png"] } }),
    field("storage", { key: "upload.rules.postImage", label: "Extension/MIME ảnh bài viết", priority: "P0", type: "json", defaultValue: { extensions: ["jpg", "jpeg", "png", "webp", "avif"], mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"] } }),
    field("storage", { key: "upload.rules.banner", label: "Extension/MIME banner", priority: "P0", type: "json", defaultValue: { extensions: ["jpg", "jpeg", "png", "webp", "avif"], mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"] } }),
    field("storage", { key: "application.maxDocuments", label: "Số tài liệu tối đa mỗi hồ sơ", priority: "P0", type: "number", defaultValue: 12, min: 1, max: 50, integer: true }),
    field("storage", { key: "storage.userQuotaMb", label: "Quota mỗi user (MB)", priority: "P1", type: "number", defaultValue: 500, min: 10, max: 100000, integer: true }),
    field("storage", { key: "storage.organizationQuotaMb", label: "Quota mỗi tổ chức (MB)", priority: "P1", type: "number", defaultValue: 5000, min: 100, max: 1000000, integer: true }),
    field("storage", { key: "signedUrl.inlineTtlSeconds", label: "TTL xem inline (giây)", priority: "P0", type: "number", defaultValue: 300, min: 60, max: 3600, integer: true }),
    field("storage", { key: "signedUrl.downloadTtlSeconds", label: "TTL tải xuống (giây)", priority: "P0", type: "number", defaultValue: 120, min: 60, max: 3600, integer: true }),
    field("storage", { key: "antivirus.enabled", label: "Bật quét antivirus", priority: "P0", type: "boolean", defaultValue: true }),
    field("storage", { key: "antivirus.infectedAction", label: "Khi phát hiện mã độc", priority: "P0", type: "select", defaultValue: "QUARANTINE", options: [option("BLOCK", "Chặn"), option("QUARANTINE", "Cách ly"), option("ALERT", "Chỉ cảnh báo")] }),
    field("storage", { key: "kyc.watermarkEnabled", label: "Watermark khi xem KYC", priority: "P1", type: "boolean", defaultValue: true }),
    field("storage", { key: "image.maxDimensionPx", label: "Kích thước ảnh tối đa (px)", priority: "P1", type: "number", defaultValue: 4096, min: 512, max: 12000, integer: true }),
    field("storage", { key: "image.quality", label: "Chất lượng nén ảnh (%)", priority: "P1", type: "number", defaultValue: 82, min: 20, max: 100, integer: true }),
    field("storage", { key: "image.generateFormats", label: "Định dạng ảnh sinh thêm", priority: "P1", type: "list", defaultValue: ["webp", "avif"] }),
    field("storage", { key: "storage.orphanRetentionDays", label: "Giữ file mồ côi (ngày)", priority: "P1", type: "number", defaultValue: 7, min: 1, max: 90, integer: true }),
    field("storage", { key: "storage.cdnBaseUrl", label: "CDN base URL", priority: "P1", type: "url", defaultValue: "" }),
];
const scholarships = [
    field("scholarships", { key: "organization.autoApproveTrusted", label: "Tự duyệt tổ chức tin cậy", priority: "P0", type: "boolean", defaultValue: false }),
    field("scholarships", { key: "trustedOrganization.minApproved", label: "Số HB đã duyệt tối thiểu", priority: "P0", type: "number", defaultValue: 10, min: 1, max: 10000, integer: true }),
    field("scholarships", { key: "trustedOrganization.maxRejectionPercent", label: "Tỷ lệ từ chối tối đa (%)", priority: "P0", type: "number", defaultValue: 5, min: 0, max: 100 }),
    field("scholarships", { key: "trustedOrganization.minAccountAgeMonths", label: "Tuổi tài khoản tối thiểu (tháng)", priority: "P0", type: "number", defaultValue: 6, min: 0, max: 120, integer: true }),
    field("scholarships", { key: "scholarship.reviewSlaHours", label: "SLA duyệt (giờ)", priority: "P0", type: "number", defaultValue: 24, min: 1, max: 720, integer: true }),
    field("scholarships", { key: "scholarship.warningYellowHours", label: "Ngưỡng cảnh báo vàng (giờ)", priority: "P0", type: "number", defaultValue: 18, min: 1, max: 720, integer: true }),
    field("scholarships", { key: "scholarship.warningRedHours", label: "Ngưỡng cảnh báo đỏ (giờ)", priority: "P0", type: "number", defaultValue: 24, min: 1, max: 720, integer: true }),
    field("scholarships", { key: "scholarship.escalation", label: "Luật escalation", priority: "P1", type: "json", defaultValue: { afterHours: 30, action: "NOTIFY_LEAD" } }),
    field("scholarships", { key: "scholarship.autoAssignStrategy", label: "Chiến lược auto-assign", priority: "P1", type: "select", defaultValue: "ROUND_ROBIN", options: [option("ROUND_ROBIN"), option("LOAD_BASED"), option("BY_FIELD")] }),
    field("scholarships", { key: "scholarship.maxPerOrganizationPerDay", label: "Số HB tối đa/tổ chức/ngày", priority: "P1", type: "number", defaultValue: 20, min: 1, max: 1000, integer: true }),
    field("scholarships", { key: "scholarship.requiredFields", label: "Trường bắt buộc khi đăng", priority: "P1", type: "list", defaultValue: ["title", "summary", "description", "deadline", "eligibility", "requiredDocuments"] }),
    field("scholarships", { key: "scholarship.descriptionMinLength", label: "Độ dài mô tả tối thiểu", priority: "P2", type: "number", defaultValue: 200, min: 0, max: 10000, integer: true }),
    field("scholarships", { key: "scholarship.descriptionMaxLength", label: "Độ dài mô tả tối đa", priority: "P2", type: "number", defaultValue: 20000, min: 100, max: 100000, integer: true }),
    field("scholarships", { key: "scholarship.expireAfterDeadlineDays", label: "Tự chuyển EXPIRED sau deadline (ngày)", priority: "P0", type: "number", defaultValue: 0, min: 0, max: 365, integer: true }),
    field("scholarships", { key: "scholarship.maxDeadlineExtensions", label: "Số lần gia hạn deadline", priority: "P1", type: "number", defaultValue: 1, min: 0, max: 20, integer: true }),
    field("scholarships", { key: "scholarship.reviewChecklist", label: "Checklist kiểm duyệt", priority: "P1", type: "json", defaultValue: [{ id: "source", label: "Nguồn và tổ chức hợp lệ", required: true }, { id: "content", label: "Nội dung đầy đủ, không gây hiểu nhầm", required: true }, { id: "deadline", label: "Deadline và quyền lợi hợp lệ", required: true }] }),
    field("scholarships", { key: "scholarship.rejectionReasons", label: "Danh mục lý do từ chối", priority: "P0", type: "json", defaultValue: [{ code: "INCOMPLETE", label: "Thông tin chưa đầy đủ", emailTemplate: "scholarship-rejected" }, { code: "UNVERIFIED_SOURCE", label: "Nguồn chưa xác minh", emailTemplate: "scholarship-rejected" }] }),
    field("scholarships", { key: "scholarship.blockedKeywords", label: "Từ khóa bị chặn", priority: "P1", type: "list", defaultValue: [] }),
    field("scholarships", { key: "scholarship.duplicateSimilarityPercent", label: "Ngưỡng trùng lặp (%)", priority: "P2", type: "number", defaultValue: 85, min: 0, max: 100 }),
    field("scholarships", { key: "scholarship.allowPublishedEdit", label: "Cho sửa sau khi publish", priority: "P0", type: "boolean", defaultValue: true }),
    field("scholarships", { key: "scholarship.reReviewAfterPublishedEdit", label: "Duyệt lại sau khi sửa", priority: "P0", type: "boolean", defaultValue: true }),
    field("scholarships", { key: "scholarship.maxFeatured", label: "Số học bổng nổi bật tối đa", priority: "P1", type: "number", defaultValue: 12, min: 1, max: 100, integer: true }),
];
const applications = [
    field("applications", { key: "application.maxPerUserPerDay", label: "Số hồ sơ tối đa/user/ngày", priority: "P0", type: "number", defaultValue: 10, min: 1, max: 1000, integer: true }),
    field("applications", { key: "application.maxPerUserTotal", label: "Tổng số hồ sơ tối đa/user", priority: "P0", type: "number", defaultValue: 100, min: 1, max: 100000, integer: true }),
    field("applications", { key: "application.fraudThreshold", label: "Ngưỡng cảnh báo gian lận", priority: "P0", type: "json", defaultValue: { count: 5, withinMinutes: 10 } }),
    field("applications", { key: "application.withdrawEnabled", label: "Cho phép rút hồ sơ", priority: "P1", type: "boolean", defaultValue: true }),
    field("applications", { key: "application.withdrawWithinHours", label: "Cho rút trong (giờ)", priority: "P1", type: "number", defaultValue: 24, min: 0, max: 8760, integer: true }),
    field("applications", { key: "application.editAfterSubmit", label: "Cho sửa sau khi nộp", priority: "P1", type: "boolean", defaultValue: false }),
    field("applications", { key: "application.deadlineReminderDays", label: "Các mốc nhắc deadline (ngày)", priority: "P0", type: "list", defaultValue: ["7", "3", "1"] }),
    field("applications", { key: "application.requiredDocumentsByScholarshipType", label: "Tài liệu bắt buộc theo loại HB", priority: "P1", type: "json", defaultValue: { FULL: ["CV", "TRANSCRIPT"], PARTIAL: ["CV"], GRANT: ["CV"] } }),
    field("applications", { key: "application.defaultGpaScale", label: "Thang GPA mặc định", priority: "P1", type: "select", defaultValue: "4.0", options: [option("4.0"), option("10.0"), option("100")] }),
    field("applications", { key: "application.gpaConversion", label: "Bảng quy đổi GPA", priority: "P1", type: "json", defaultValue: { "10_to_4": [{ min: 8.5, value: 4 }, { min: 7, value: 3 }, { min: 5.5, value: 2 }] } }),
    field("applications", { key: "application.coverLetterMinLength", label: "Độ dài thư động lực tối thiểu", priority: "P2", type: "number", defaultValue: 300, min: 0, max: 10000, integer: true }),
    field("applications", { key: "application.plagiarismEnabled", label: "Kiểm tra trùng lặp nội dung", priority: "P2", type: "boolean", defaultValue: false }),
    field("applications", { key: "application.plagiarismThresholdPercent", label: "Ngưỡng trùng lặp nội dung (%)", priority: "P2", type: "number", defaultValue: 30, min: 0, max: 100 }),
    field("applications", { key: "application.inactiveAutoCloseDays", label: "Tự đóng hồ sơ không hoạt động (ngày)", priority: "P2", type: "number", defaultValue: 90, min: 0, max: 730, integer: true }),
];
const kyc = [
    field("kyc", { key: "kyc.requiredDocumentsByOrganizationType", label: "Giấy tờ bắt buộc theo loại tổ chức", priority: "P0", type: "json", defaultValue: { BUSINESS: ["business_license", "tax_registration"], SCHOOL: ["establishment_decision"], NON_PROFIT: ["operation_license"], INDIVIDUAL: ["identity_document"] } }),
    field("kyc", { key: "kyc.reviewSlaHours", label: "SLA xử lý KYC (giờ)", priority: "P0", type: "number", defaultValue: 48, min: 1, max: 720, integer: true }),
    field("kyc", { key: "kyc.validityMonths", label: "Hiệu lực xác minh (tháng)", priority: "P1", type: "number", defaultValue: 24, min: 1, max: 120, integer: true }),
    field("kyc", { key: "kyc.blockDuplicateTaxCode", label: "Chặn trùng mã số thuế", priority: "P0", type: "boolean", defaultValue: true }),
    field("kyc", { key: "organization.maxMembers", label: "Số thành viên tối đa/tổ chức", priority: "P1", type: "number", defaultValue: 20, min: 1, max: 10000, integer: true }),
    field("kyc", { key: "kyc.requiredBeforeScholarship", label: "Bắt buộc KYC trước khi đăng HB", priority: "P0", type: "boolean", defaultValue: true }),
    field("kyc", { key: "kyc.rejectionReasons", label: "Danh mục lý do từ chối KYC", priority: "P0", type: "json", defaultValue: [{ code: "DOCUMENT_INVALID", label: "Giấy tờ không hợp lệ" }, { code: "INFORMATION_MISMATCH", label: "Thông tin không khớp" }] }),
    field("kyc", { key: "kyc.autoFlagRiskScore", label: "Ngưỡng risk score tự động flag", priority: "P2", type: "number", defaultValue: 70, min: 0, max: 100 }),
];
const support = [
    field("support", { key: "support.businessHours", label: "Giờ làm việc theo tuần", priority: "P0", type: "json", defaultValue: { MONDAY: ["08:00", "17:30"], TUESDAY: ["08:00", "17:30"], WEDNESDAY: ["08:00", "17:30"], THURSDAY: ["08:00", "17:30"], FRIDAY: ["08:00", "17:30"], SATURDAY: null, SUNDAY: null } }),
    field("support", { key: "support.slaByPriority", label: "SLA theo mức ưu tiên", priority: "P0", type: "json", defaultValue: { LOW: { firstResponseHours: 24, resolutionHours: 72 }, NORMAL: { firstResponseHours: 8, resolutionHours: 48 }, HIGH: { firstResponseHours: 4, resolutionHours: 24 }, URGENT: { firstResponseHours: 1, resolutionHours: 8 } } }),
    field("support", { key: "support.autoAssignStrategy", label: "Chiến lược auto-assign", priority: "P1", type: "select", defaultValue: "ROUND_ROBIN", options: [option("ROUND_ROBIN"), option("LOAD_BASED"), option("BY_TOPIC")] }),
    field("support", { key: "support.autoCloseWaitingDays", label: "Auto-close WAITING sau (ngày)", priority: "P1", type: "number", defaultValue: 7, min: 1, max: 365, integer: true }),
    field("support", { key: "support.outOfHoursMessage", label: "Tin nhắn ngoài giờ", priority: "P1", type: "textarea", defaultValue: "Yêu cầu của bạn đã được ghi nhận. Đội ngũ TopScholar sẽ phản hồi trong giờ làm việc gần nhất." }),
    field("support", { key: "support.maxTicketsPerAgent", label: "Số ticket tối đa/nhân viên", priority: "P2", type: "number", defaultValue: 50, min: 1, max: 1000, integer: true }),
    field("support", { key: "support.csatEnabled", label: "Gửi khảo sát CSAT sau khi đóng", priority: "P1", type: "boolean", defaultValue: true }),
    field("support", { key: "support.attachmentsEnabled", label: "Cho phép đính kèm file", priority: "P1", type: "boolean", defaultValue: true }),
    field("support", { key: "support.attachmentMaxMb", label: "Giới hạn file đính kèm (MB)", priority: "P1", type: "number", defaultValue: 10, min: 1, max: 100, integer: true }),
    field("support", { key: "support.escalation", label: "Luật escalation", priority: "P2", type: "json", defaultValue: { maxEscalations: 2, recipients: [] } }),
];
const notifications = [
    field("notifications", { key: "mail.provider", label: "Nhà cung cấp email", priority: "P0", type: "select", defaultValue: "SMTP", options: [option("SMTP"), option("SES"), option("SENDGRID")] }),
    field("notifications", { key: "mail.host", label: "SMTP host", priority: "P0", type: "text", defaultValue: "localhost" }),
    field("notifications", { key: "mail.port", label: "SMTP port", priority: "P0", type: "number", defaultValue: 1025, min: 1, max: 65535, integer: true }),
    field("notifications", { key: "mail.secure", label: "SMTP TLS trực tiếp", priority: "P0", type: "boolean", defaultValue: false }),
    field("notifications", { key: "mail.username", label: "SMTP username", priority: "P0", type: "text", defaultValue: "" }),
    field("notifications", { key: "mail.password", label: "SMTP password/API key", priority: "P0", type: "secret", defaultValue: "", secret: true }),
    field("notifications", { key: "mail.fromName", label: "From name", priority: "P0", type: "text", defaultValue: "TopScholar" }),
    field("notifications", { key: "mail.fromEmail", label: "From email", priority: "P0", type: "email", defaultValue: "no-reply@topscholar.vn" }),
    field("notifications", { key: "mail.replyTo", label: "Reply-to", priority: "P0", type: "email", defaultValue: "support@topscholar.vn" }),
    field("notifications", { key: "mail.archiveBcc", label: "BCC lưu trữ", priority: "P0", type: "email", defaultValue: "" }),
    field("notifications", { key: "mail.rateLimitPerMinute", label: "Giới hạn gửi/phút", priority: "P1", type: "number", defaultValue: 60, min: 1, max: 100000, integer: true }),
    field("notifications", { key: "mail.rateLimitPerHour", label: "Giới hạn gửi/giờ", priority: "P1", type: "number", defaultValue: 1000, min: 1, max: 1000000, integer: true }),
    field("notifications", { key: "notification.channelMatrix", label: "Ma trận loại thông báo × kênh", priority: "P0", type: "json", defaultValue: { APPLICATION_SUBMITTED: { IN_APP: true, EMAIL: true, PUSH: false, SMS: false, ZALO: false }, APPLICATION_STATUS_CHANGED: { IN_APP: true, EMAIL: true, PUSH: false, SMS: false, ZALO: false }, SCHOLARSHIP_DEADLINE: { IN_APP: true, EMAIL: true, PUSH: false, SMS: false, ZALO: false }, SECURITY_ALERT: { IN_APP: true, EMAIL: true, PUSH: false, SMS: false, ZALO: false } } }),
    field("notifications", { key: "notification.digest", label: "Tần suất digest", priority: "P1", type: "select", defaultValue: "IMMEDIATE", options: [option("IMMEDIATE", "Ngay"), option("HOURLY", "Hàng giờ"), option("DAILY", "Hàng ngày")] }),
    field("notifications", { key: "mail.sandboxEnabled", label: "Sandbox mode", priority: "P0", type: "boolean", defaultValue: true }),
    field("notifications", { key: "mail.sandboxRecipient", label: "Email nhận trong sandbox", priority: "P0", type: "email", defaultValue: "" }),
    field("notifications", { key: "mail.suppressionList", label: "Suppression list", priority: "P1", type: "list", defaultValue: [] }),
    field("notifications", { key: "mail.footer", label: "Footer email", priority: "P0", type: "textarea", defaultValue: "Bạn nhận email này từ TopScholar. Vui lòng không trả lời trực tiếp email tự động." }),
    field("notifications", { key: "mail.unsubscribeUrl", label: "Link hủy đăng ký", priority: "P0", type: "url", defaultValue: "" }),
    field("notifications", { key: "mail.retryCount", label: "Số lần retry", priority: "P1", type: "number", defaultValue: 3, min: 0, max: 20, integer: true }),
    field("notifications", { key: "sms.provider", label: "SMS provider", priority: "P2", type: "text", defaultValue: "" }),
    field("notifications", { key: "sms.apiKey", label: "SMS API key", priority: "P2", type: "secret", defaultValue: "", secret: true }),
    field("notifications", { key: "zalo.oaId", label: "Zalo OA ID", priority: "P2", type: "text", defaultValue: "" }),
    field("notifications", { key: "zalo.accessToken", label: "Zalo access token", priority: "P2", type: "secret", defaultValue: "", secret: true }),
];
const seo = [
    field("seo", { key: "seo.defaultTitle", label: "Meta title mặc định", priority: "P0", type: "text", defaultValue: "TopScholar — Cổng thông tin học bổng" }),
    field("seo", { key: "seo.defaultDescription", label: "Meta description mặc định", priority: "P0", type: "textarea", defaultValue: "Khám phá và ứng tuyển các cơ hội học bổng uy tín cùng TopScholar." }),
    field("seo", { key: "seo.titleTemplate", label: "Template tiêu đề", priority: "P0", type: "text", defaultValue: "%s — TopScholar" }),
    field("seo", { key: "seo.defaultOgImageUrl", label: "OG image mặc định", priority: "P0", type: "url", defaultValue: "" }),
    field("seo", { key: "seo.canonicalDomain", label: "Canonical domain", priority: "P0", type: "url", defaultValue: "https://topscholar.vn" }),
    field("seo", { key: "seo.forceHttps", label: "Bắt buộc HTTPS", priority: "P0", type: "boolean", defaultValue: true }),
    field("seo", { key: "seo.domainStyle", label: "Kiểu tên miền", priority: "P0", type: "select", defaultValue: "NON_WWW", options: [option("NON_WWW", "Không www"), option("WWW", "Có www")] }),
    field("seo", { key: "seo.robotsTxt", label: "robots.txt", priority: "P0", type: "textarea", defaultValue: "User-agent: *\nAllow: /\nSitemap: https://topscholar.vn/sitemap.xml" }),
    field("seo", { key: "seo.noindexSite", label: "Noindex toàn site", priority: "P0", type: "boolean", defaultValue: true }),
    field("seo", { key: "seo.sitemapEnabled", label: "Bật sitemap", priority: "P1", type: "boolean", defaultValue: true }),
    field("seo", { key: "seo.sitemapFrequency", label: "Tần suất sitemap", priority: "P1", type: "select", defaultValue: "DAILY", options: [option("HOURLY"), option("DAILY"), option("WEEKLY")] }),
    field("seo", { key: "seo.sitemapContentTypes", label: "Loại nội dung trong sitemap", priority: "P1", type: "list", defaultValue: ["scholarships", "posts", "pages"] }),
    field("seo", { key: "analytics.ga4Id", label: "GA4 ID", priority: "P1", type: "text", defaultValue: "" }),
    field("seo", { key: "analytics.gtmId", label: "GTM ID", priority: "P1", type: "text", defaultValue: "" }),
    field("seo", { key: "analytics.facebookPixelId", label: "Facebook Pixel", priority: "P1", type: "text", defaultValue: "" }),
    field("seo", { key: "analytics.tiktokPixelId", label: "TikTok Pixel", priority: "P1", type: "text", defaultValue: "" }),
    field("seo", { key: "seo.googleSearchConsoleVerification", label: "Google Search Console verification", priority: "P1", type: "text", defaultValue: "" }),
    field("seo", { key: "seo.redirects", label: "Redirect 301", priority: "P1", type: "json", defaultValue: [], description: "Mảng JSON: [{\"from\":\"/cu\",\"to\":\"/moi\"}]." }),
    field("seo", { key: "seo.organizationSchema", label: "Schema.org Organization", priority: "P2", type: "json", defaultValue: { "@type": "Organization", name: "TopScholar", url: "https://topscholar.vn" } }),
];
exports.SYSTEM_SETTING_DEFINITIONS = [
    ...general,
    ...localization,
    ...accounts,
    ...security,
    ...storage,
    ...scholarships,
    ...applications,
    ...kyc,
    ...support,
    ...notifications,
    ...seo,
];
const DEFINITION_BY_KEY = new Map(exports.SYSTEM_SETTING_DEFINITIONS.map((definition) => [definition.key, definition]));
function getSystemSettingDefinition(key) {
    return DEFINITION_BY_KEY.get(key);
}
function getSystemSettingDefinitions(group) {
    return group ? exports.SYSTEM_SETTING_DEFINITIONS.filter((definition) => definition.group === group) : [...exports.SYSTEM_SETTING_DEFINITIONS];
}
function isSystemSettingGroup(value) {
    return exports.SYSTEM_SETTING_GROUPS.some((group) => group.id === value);
}
function validateSystemSettingValue(definition, value) {
    if (definition.type === "boolean") {
        return typeof value === "boolean" ? null : "phải là true hoặc false";
    }
    if (definition.type === "number") {
        if (typeof value !== "number" || !Number.isFinite(value))
            return "phải là số hợp lệ";
        if (definition.integer && !Number.isInteger(value))
            return "phải là số nguyên";
        if (definition.min !== undefined && value < definition.min)
            return `phải lớn hơn hoặc bằng ${definition.min}`;
        if (definition.max !== undefined && value > definition.max)
            return `phải nhỏ hơn hoặc bằng ${definition.max}`;
        return null;
    }
    if (definition.type === "list") {
        if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
            return "phải là danh sách chuỗi";
        if (value.length > 500)
            return "không được vượt quá 500 phần tử";
        return null;
    }
    if (definition.type === "json") {
        if (value === null || typeof value !== "object")
            return "phải là JSON object hoặc array";
        return null;
    }
    if (typeof value !== "string")
        return "phải là chuỗi";
    if (value.length > 100_000)
        return "quá dài";
    if (definition.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "không phải email hợp lệ";
    if (definition.type === "url" && value) {
        try {
            const parsed = new URL(value);
            if (!["http:", "https:"].includes(parsed.protocol))
                return "chỉ chấp nhận URL http/https";
        }
        catch {
            return "không phải URL hợp lệ";
        }
    }
    if (definition.type === "color" && !/^#[0-9A-Fa-f]{6}$/.test(value))
        return "phải là mã màu hex dạng #0866FF";
    if (definition.type === "select" && definition.options && !definition.options.some((item) => item.value === value))
        return "không thuộc danh sách cho phép";
    return null;
}
function getSystemSettingDefaults(group) {
    return Object.fromEntries(getSystemSettingDefinitions(group).map((definition) => [definition.key, definition.defaultValue]));
}
exports.SENSITIVE_SYSTEM_SETTING_KEYS = exports.SYSTEM_SETTING_DEFINITIONS
    .filter((definition) => definition.secret)
    .map((definition) => definition.key);
//# sourceMappingURL=system-settings.js.map