export class User {
    userId;
    wechatId;
    avatarUrl;
    nickname;
    zip;
    email;

    constructor({ user_id, avatar_url, nickname, postal_code, wechat_id, email_address }) {
        this.userId = user_id ?? "ortx2500000000000000000000000";
        this.wechatId = wechat_id ?? "Unknown Wechat User";
        this.avatarUrl = avatar_url ?? "";
        this.nickname = nickname ?? "未知用户";
        this.zip = postal_code ?? 10000;
        this.email = email_address ?? "unknown@example.com";
    }
}