# GitHub Pages + Supabase 留言板

这是一个不需要本地构建的最小全栈示例：

- 前端：GitHub Pages
- 数据库：Supabase PostgreSQL
- 功能：读取并发布公开留言

## 1. 创建 Supabase 数据库

1. 登录 [Supabase](https://supabase.com/) 并创建项目。
2. 打开 **SQL Editor**。
3. 复制项目中 `supabase.sql` 的全部内容并运行。
4. 打开项目的 **Connect** 或 **Settings → API Keys**，记录：
   - Project URL
   - Publishable key（`sb_publishable_...`）

不要使用 `sb_secret_...` 或 `service_role` 密钥，它们不能放在网页中。

## 2. 配置网页

打开 `config.js`，填写：

```js
window.APP_CONFIG = {
  supabaseUrl: "https://你的项目.supabase.co",
  supabasePublishableKey: "sb_publishable_你的公开密钥"
};
```

Publishable key 会出现在公开网页源码中，这是正常的。数据库安全由 `supabase.sql` 中的 RLS 策略控制。

## 3. 本地预览

不能直接双击 `index.html`，请运行一个静态服务器：

```bash
python -m http.server 8080
```

然后打开：

```text
http://127.0.0.1:8080
```

## 4. 发布到 GitHub

在 GitHub 新建一个公开仓库，然后在本项目目录运行：

```bash
git init
git add .
git commit -m "Add GitHub Pages Supabase demo"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

进入仓库：

```text
Settings → Pages → Source → GitHub Actions
```

推送完成后等待 Actions 部署，网址通常是：

```text
https://你的用户名.github.io/你的仓库名/
```

## 安全说明

当前示例为了便于测试，允许任何访客读取和新增留言，但不允许修改或删除。公开写入接口可能被滥用，只适合学习和短期测试。

正式项目应增加：

- Supabase Auth 用户登录；
- 仅登录用户可写入的 RLS 策略；
- 验证码、频率限制或后端 API；
- 内容审核与管理员删除能力。
