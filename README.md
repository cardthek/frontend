# 卡迹 · 前端交互演示

银行卡卡面档案网站 **卡迹** 的纯前端演示版本。该仓库只包含 `demo-frontend`，不连接后端，也不发送任何 API 请求；所有数据保存在 React 内存状态中，刷新页面后恢复初始演示数据。

正式项目规划为三个彼此独立的 Git 仓库：

- `demo-frontend`：当前交互演示，用于确认信息架构、视觉与流程
- `frontend`：正式前后端分离前端
- `backend`：RESTful API 服务

当前仓库不会混入正式 `frontend` 或 `backend` 代码。

## 技术栈

- Next.js 16（App Router）
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI
- Lucide Icons
- Sonner
- pnpm

## 启动

```bash
pnpm install
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

生产构建检查：

```bash
pnpm lint
pnpm build
pnpm start
```

## 演示账号

密码在演示中不会校验，可直接登录，也可以在右下角“演示控制台”中切换身份。

| 身份 | 用户名 | 邮箱 | 角色 |
| --- | --- | --- | --- |
| 管理员 | `admin` | `admin@cardji.local` | 超级管理员 |
| 审核员 | `reviewer` | `reviewer@cardji.local` | 审核员 |
| 收藏者 | `lin` | `lin@example.com` | 成员 |
| 收藏者 | `xiaoye` | `xiaoye@example.com` | 成员 |

演示控制台还可以：

- 切换访客、成员、审核员与管理员
- 实时切换主题
- 进入网站初始化安装流程
- 重置全部演示数据

## 已实现流程

### 公开站

- 首页与精选卡片
- 卡面档案筛选
- 卡片详情与字段可见性
- 贡献者公开主页
- 关于页面
- 响应式导航

### 账号与安装

- 登录、注册、忘记密码演示
- 网站初始化安装
- 个人资料编辑
- 我的投稿、新建投稿、编辑投稿
- 投稿状态、审核反馈与审核历史

### 管理后台

- 仪表盘与站点状态
- 投稿审核：通过、拒绝、要求修改
- 卡片管理：后台新增、独立编辑页、发布、隐藏、精选、删除
- 用户管理：后台新增、独立编辑页、启停、删除、用户组单选、修改密码
- 用户组与权限：创建用户组、编辑权限节点
- 字典管理：新增、启停、引用保护删除
- 媒体库：模拟上传、UUID 复制、引用保护删除
- 站点设置：注册模式、邮箱验证、上传限制、字段默认可见性
- 审计日志：资源、动作与关键词筛选

所有后台页面都有权限守卫，菜单和操作按钮读取同一套权限节点。

## 一套代码切换主题

主题系统采用“语义化 CSS 变量 + `data-theme`”实现。页面与业务组件不直接写主题色，只消费以下语义 token：

```css
var(--background)
var(--foreground)
var(--primary)
var(--secondary)
var(--surface)
var(--border)
var(--radius-card)
var(--shadow-card)
var(--font-heading)
```

主题文件：

```text
src/styles/themes/natural.css
src/styles/themes/editorial.css
src/styles/themes/corporate-clean.css
```

当前提供：

- `natural`：自然手作，柔和、圆润、纸张感
- `editorial`：植物图鉴，克制、紧凑、编辑感
- `corporate-clean`：企业简洁，蓝灰配色、克制阴影与专业 B2B 风格

### 新增主题

1. 新建 `src/styles/themes/<theme>.css`
2. 使用 `[data-theme="<theme>"]` 定义同一组语义变量
3. 在 `src/app/globals.css` 中 `@import` 新文件
4. 在 `src/lib/types.ts` 的 `ThemeId` 中加入主题名
5. 在演示控制台的主题选项中注册

不需要修改页面组件、业务逻辑或数据模型。

## 数据与安全边界

- 所有卡片、用户、角色、字典、媒体与日志数据均为虚构
- 只记录公开卡面设计信息，不建模卡号、有效期、安全码等支付敏感数据
- 文件上传仅模拟记录文件元数据，不读取或上传真实文件内容
- 登录、注册与密码流程不保存真实凭据
- 删除用户采用软删除：卡片归属保留，公开页面显示“账号已注销”
- 当前版本没有任何后端请求

## 目录

```text
src/
  app/                 页面路由与布局
  components/          业务组件、布局与基础 UI
  data/seed.ts         演示数据与权限节点
  lib/demo-store.tsx   内存状态、权限判断与演示操作
  lib/types.ts         数据模型
  styles/themes/       主题 CSS token
```

## 后续接入后端

正式版本将基于独立后端仓库提供 RESTful API。前端接入时只替换数据访问层，保留现有页面组件、权限语义和主题 token；当前演示仓库不会被直接合并到正式仓库。
