# cardthek 正式前端

银行卡卡面档案站的前端应用。该仓库只包含 Next.js 前端，所有业务数据均通过独立的后端 REST API 获取。

后端仓库位于同级 `backend` 文件夹，两个项目分别维护 Git 历史，不共享仓库或提交。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI
- Lucide Icons
- Sonner
- pnpm

## 本地启动

先启动后端服务（默认 `http://localhost:4000`），然后运行：

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

默认访问 [http://localhost:3000](http://localhost:3000)。

前端通过运行时 Route Handler 把同源请求代理到后端：

```text
/api/v1/*  ->  http://localhost:4000/api/v1/*
/uploads/* ->  http://localhost:4000/uploads/*
```

`BACKEND_ORIGIN` 在服务端运行时读取，因此部署平台修改环境变量后不需要重新改代码。浏览器不会直接跨域请求 API，刷新令牌 Cookie、媒体文件和管理页面都保持同源。

## 环境变量

```env
NEXT_PUBLIC_USE_BACKEND_PROXY=true
BACKEND_ORIGIN=http://localhost:4000
NEXT_PUBLIC_API_BASE_URL=/api/v1
```

- `NEXT_PUBLIC_USE_BACKEND_PROXY=true`：浏览器请求 `/api/v1`，由 Next.js Route Handler 转发后端。
- `NEXT_PUBLIC_USE_BACKEND_PROXY=false`：浏览器直接请求 `NEXT_PUBLIC_API_BASE_URL`，必须填写完整后端 URL。
- `BACKEND_ORIGIN` 只在 Next.js 服务端使用。
- `NEXT_PUBLIC_API_BASE_URL` 会进入浏览器构建产物。

## 部署到 Cloudflare Workers

本项目包含 `/api/v1/*` 和 `/uploads/*` 动态 Route Handler，因此应部署为 **Cloudflare Worker**，不要选择纯静态的 Pages 项目，也不要使用旧的 `@cloudflare/next-on-pages`。仓库已经接入当前推荐的 OpenNext Cloudflare 适配器：

```text
@opennextjs/cloudflare
wrangler
open-next.config.ts
wrangler.jsonc
```

Worker 名称配置为 `cardthek`。默认使用 Worker 反向代理后端，避免浏览器跨站 Cookie 限制。

Cloudflare 适配器当前不启用 Next.js 实验性的 Cache Components / Partial Prefetching；对应配置和路由级 `instant` 标记已移除，普通静态预渲染和动态 Route Handler 均正常。

### 方式一：命令行部署

```bash
pnpm install --frozen-lockfile
pnpm exec wrangler login
pnpm deploy
```

部署前可在 `.env.local` 或当前 shell 中配置：

```env
NEXT_PUBLIC_USE_BACKEND_PROXY=true
NEXT_PUBLIC_API_BASE_URL=/api/v1
```

`NEXT_PUBLIC_*` 会在构建时写入浏览器代码，修改后必须重新运行 `pnpm deploy`。

本地 Worker 运行时预览：

```bash
cp .dev.vars.example .dev.vars
pnpm preview
```

### 方式二：Cloudflare Workers Builds 连接 Git

在 Cloudflare 控制台的 **Workers & Pages → Create → Workers → Connect to Git** 导入 `cardthek/frontend` 仓库，使用以下设置：

```text
Production branch: main
Root directory: /
Node.js version: 22
Build command: pnpm exec opennextjs-cloudflare build
Deploy command: pnpm exec wrangler deploy
```

在构建环境变量中配置：

```env
NODE_VERSION=22
NEXT_PUBLIC_USE_BACKEND_PROXY=true
NEXT_PUBLIC_API_BASE_URL=/api/v1
```

`BACKEND_ORIGIN=https://card.yurik.cafe` 已写入 `wrangler.jsonc` 的 `vars`。如果后端地址发生变化，应修改该文件并重新部署，不建议只在临时 shell 中修改。后端地址不是密钥。

### 绑定自定义域名

首次部署后会获得 `cardthek.<account>.workers.dev` 地址。进入 Worker 的 **Settings → Domains & Routes → Add custom domain** 绑定正式域名即可。

### 使用浏览器直连模式

不希望 Worker 代理 API 和图片时，在构建环境配置：

```env
NEXT_PUBLIC_USE_BACKEND_PROXY=false
NEXT_PUBLIC_API_BASE_URL=https://card.yurik.cafe/api/v1
```

同时把 Worker 自定义域名加入后端 `CORS_ORIGINS`，并配置：

```env
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
```

直连模式下刷新 Cookie 属于第三方 Cookie，部分浏览器可能限制会话恢复，因此登录站点仍推荐 Worker 代理模式。

当前不使用 Next.js ISR 页面缓存，所以基础配置不需要 R2。以后启用 ISR、`revalidateTag` 等服务端缓存时，再按 OpenNext 文档添加 `NEXT_INC_CACHE_R2_BUCKET` 和 Worker 自引用绑定。

## 部署到 Netlify

当前应用使用 Next.js Route Handler 代理后端，不能使用纯静态导出。Netlify 需要启用 Next.js Runtime，仓库已包含 `netlify.toml` 和 `@netlify/plugin-nextjs`。

由于 `frontend` 是独立 Git 仓库，在 Netlify 中应直接导入该仓库，并将 **Base directory** 留空或填写 `./`。只有导入包含 `frontend` 与 `backend` 的 monorepo 时，才需要填写 `frontend`。

### 模式一：通过 Netlify 反代后端

这是默认和推荐模式。在 Netlify 的 **Site configuration → Environment variables** 配置：

```env
NEXT_PUBLIC_USE_BACKEND_PROXY=true
BACKEND_ORIGIN=https://api.example.com
NEXT_PUBLIC_API_BASE_URL=/api/v1
```

- `BACKEND_ORIGIN` 填独立后端的公网 HTTPS 地址，不包含最后的 `/api/v1`。
- 保持 `NEXT_PUBLIC_API_BASE_URL=/api/v1`，浏览器请求会经过 Netlify Function 代理。
- Netlify 域名应该配置在后台的 `CORS_ORIGINS` 中。
- 后端必须使用 HTTPS，并设置 `COOKIE_SECURE=true`。
- `BACKEND_ORIGIN` 是公开端点地址而不是密钥，因此 `netlify.toml` 只对该环境变量关闭秘密扫描；不要用同样方式绕过 JWT 密钥或访问令牌。

### 模式二：浏览器直连后端

不经过 Netlify Function 时配置：

```env
NEXT_PUBLIC_USE_BACKEND_PROXY=false
NEXT_PUBLIC_API_BASE_URL=https://card.yurik.cafe/api/v1
```

后端还必须配置：

```env
CORS_ORIGINS=https://cardthek.com,https://www.cardthek.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
```

直连模式下 API 和卡面图片都会直接访问后端域名。由于刷新 Cookie 属于第三方 Cookie，部分浏览器或隐私设置可能拦截登录会话恢复，因此生产环境优先推荐反代模式。

修改环境变量后需要重新部署，因为 Netlify Function 的运行环境会在新部署中更新。

> Netlify Function 对请求体和单次执行时间有平台限制，具体数值随套餐变化。若需要上传较大的卡面原图，请把站点后台的 `maxImageSizeMb` 调整到平台限制以内；更高上限建议改用对象存储直传或独立媒体域名。

## 认证模型

- 登录成功后将短期访问令牌保存在前端内存中。
- 刷新令牌由后端写入 HttpOnly Cookie。
- 页面刷新时调用 `/auth/refresh` 恢复会话。
- 访问令牌过期后，API 客户端自动刷新并重试一次原请求。
- 退出登录会撤销后端会话并清理 Cookie。

## 数据层

业务页面不包含演示数据，也不在浏览器中把权限判断当作安全边界。

- `src/lib/api-client.ts`：REST 请求、错误标准化、访问令牌与自动刷新。
- `src/lib/app-store.tsx`：服务端数据快照、重新获取和 API mutation 封装。
- `src/lib/types.ts`：前端共享类型。
- 后端始终负责权限校验、字段可见性、唯一性校验和状态流转。

后台首次加载通过 `/api/v1/bootstrap` 获取当前身份可见的站点数据。写操作完成后会重新拉取快照，确保页面与数据库状态一致。

卡面组件会根据图片实际宽高自动识别横版或竖版：横版使用 `85.6:53.98`，竖版使用 `53.98:85.6`，两种方向继续遵守 ISO 7813 的 `3.18mm` 圆角比例。

## 主题

所有页面只消费语义化 CSS token，主题切换不改动组件和业务逻辑：

```text
src/styles/themes/natural.css
src/styles/themes/editorial.css
src/styles/themes/corporate-clean.css
```

管理员在“站点设置”中选择主题后，后端保存 `theme`，前端应用通过 `data-theme` 即时切换。

## 主要路由

### 公开站

- `/`：站点首页与最新/精选卡片
- `/cards`：公开卡片档案与筛选
- `/cards/[uuid]`：卡片详情、灯箱、点赞与下载
- `/u/[slug]`：贡献者公开主页
- `/about`：站点说明与投稿边界

### 账号

- `/setup`：首次安装向导
- `/login`、`/register`
- `/forgot-password`、`/reset-password`
- `/me/profile`
- `/me/submissions`
- `/me/submissions/new`

### 管理后台

- `/admin`：运行概览
- `/admin/submissions`：投稿审核队列
- `/admin/cards`：卡片管理与独立编辑页
- `/admin/users`：用户列表与独立编辑页
- `/admin/roles`：用户组和权限节点
- `/admin/dictionaries`：发行方、卡组织、卡片类型与等级
- `/admin/media`：真实图片上传、编辑与引用保护删除
- `/admin/contributions`：协作修改审核
- `/admin/settings`：站点设置与主题
- `/admin/audit`：审计日志

## 开发检查

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## 安全边界

- 不建模或上传卡号、有效期、CVV 等支付敏感信息。
- 图片类型和大小由后端验证。
- 字段可见性由后端按用户、用户组和权限节点计算并裁剪。
- 删除用户采用软删除，并释放用户名、邮箱和 slug 的唯一值。
