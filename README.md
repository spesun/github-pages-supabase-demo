# GitHub Pages + Supabase 登录留言板

这是一个不需要本地构建的最小全栈示例：

- 前端：GitHub Pages
- 数据库：Supabase PostgreSQL
- 登录：Supabase Auth（邮箱 + 密码）
- 权限：留言公开可读，仅登录用户可发布

## 1. 创建或升级 Supabase 数据库

1. 登录 [Supabase](https://supabase.com/) 并创建项目。
2. 打开 **SQL Editor**。
3. 复制项目中 `supabase.sql` 的全部内容并运行。
4. 打开项目的 **Connect** 或 **Settings → API Keys**，记录：
   - Project URL
   - Publishable key（`sb_publishable_...`）

如果之前已经运行过旧版 SQL，也应重新运行最新版 `supabase.sql`。它会新增 `user_id` 字段、删除匿名写入策略，并改为仅登录用户可以新增留言。已有留言会保留，其 `user_id` 可以为空。

不要使用 `sb_secret_...` 或 `service_role` 密钥，它们不能放在网页中。

## 2. 配置网页

打开 `config.js`，填写：

```js
window.APP_CONFIG = {
  supabaseUrl: "https://你的项目.supabase.co",
  supabasePublishableKey: "sb_publishable_你的公开密钥"
};
```

Publishable key 会出现在公开网页源码中，这是正常的。数据库安全由 `supabase.sql` 中的数据库权限和 RLS 策略控制。

## 3. 配置 Supabase Auth

在 Supabase 控制台进入：

```text
Authentication → Providers → Email
```

确认 Email 登录已启用。建议测试阶段按以下方式选择：

- 想注册后立即登录：暂时关闭 **Confirm email**；
- 想测试真实邮件确认：保持 **Confirm email** 开启，并确保邮件模板和发送能力可用。

然后进入：

```text
Authentication → URL Configuration
```

设置：

- 本地测试 Site URL：`http://127.0.0.1:8080`
- 发布后 Site URL：改为你的 GitHub Pages 地址
- Redirect URLs：同时加入本地地址和 GitHub Pages 地址，例如：

```text
http://127.0.0.1:8080/**
https://你的用户名.github.io/你的仓库名/**
```

本示例使用邮箱和密码登录。登录会话默认保存在浏览器中，刷新页面后仍保持登录。

## 4. 本地预览

不能直接双击 `index.html`，请在项目目录运行静态服务器：

```bash
python -m http.server 8080
```

然后打开：

```text
http://127.0.0.1:8080
```

建议依次测试：

1. 未登录时可以查看留言，但发布表单不可用；
2. 注册一个测试用户；
3. 如果开启邮箱确认，到邮箱点击确认链接；
4. 登录后发布一条留言；
5. 退出登录后，留言仍可查看，但不能继续发布；
6. 刷新页面，确认已登录会话能够恢复。

## 5. 验证 RLS

最新版策略的规则是：

- `anon` 和 `authenticated` 都可以 `SELECT`；
- 只有 `authenticated` 可以 `INSERT`；
- 新留言的 `user_id` 必须等于当前登录用户的 `auth.uid()`；
- 不允许网页用户更新或删除留言。

因此，即使有人绕过网页按钮直接调用 Supabase REST API，匿名写入也会被数据库拒绝。

## 6. 发布到 GitHub

在 GitHub 新建一个公开仓库，然后在本项目目录运行：

```bash
git init
git add .
git commit -m "Add Supabase Auth message board"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

首次部署前进入仓库：

```text
Settings → Pages → Source → GitHub Actions
```

推送完成后等待 Actions 部署，网址通常是：

```text
https://你的用户名.github.io/你的仓库名/
```

发布后记得把这个地址加入 Supabase 的 **Site URL** 和 **Redirect URLs**。

## 安全说明

当前示例已经实现登录和仅登录写入，但公开注册仍可能被滥用。正式项目还应考虑：

- 开启邮箱确认；
- 增加验证码和注册/发布频率限制；
- 内容审核与管理员删除能力；
- 为用户增加昵称资料，而不是完全信任留言中的昵称字段；
- 不在前端放置 `service_role`、数据库密码或第三方私密 API Key。
