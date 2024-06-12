export class User {
    userId;
    wechatId;
    avatarUrl;
    nickname;
    zip;
    email;

    constructor({ userId, avatarUrl, nickname, postalCode, wechatId, emailAddress }) {
        this.userId = userId ?? "ortx2500000000000000000000000";
        this.wechatId = wechatId ?? "Unknown Wechat User";
        this.avatarUrl = avatarUrl ?? "";
        this.nickname = nickname ?? "未知用户";
        this.zip = postalCode ?? 10000;
        this.email = emailAddress ?? "unknown@example.com";
    }
}