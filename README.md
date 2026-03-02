# open-NGA-client

> NGA 论坛本地桌面客户端 - 基于 Tauri 2.x + Vue 3.5 构建

一个现代化的 NGA 论坛桌面客户端，提供更好的浏览体验和本地化功能。

![版本](https://img.shields.io/badge/版本-0.1.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ 主要功能

- 🔐 **扫码登录** - 使用 NGA 手机客户端扫码快速登录
- 📋 **板块管理** - 收藏和管理常用板块，支持搜索添加
- 📖 **帖子浏览** - 优化的帖子阅读体验，支持表情、图片解析
- 💬 **回复展示** - 清晰的楼层展示，支持引用跳转
- 🎨 **现代 UI** - 基于 Element Plus 的现代化界面设计
- ⚡ **快速加载** - 图片代理加速，本地缓存优化

## 🛠 技术栈

### 前端
- **框架**: Vue 3.5 (Composition API + `<script setup>`)
- **构建工具**: Vite 6.0
- **UI 组件**: Element Plus 2.9
- **样式方案**: UnoCSS 0.65 (原子化 CSS)
- **状态管理**: Pinia 2.2
- **路由**: Vue Router 4.5
- **HTTP 客户端**: Axios 1.7
- **其他**: QRCode.js（二维码生成）

### 后端
- **桌面框架**: Tauri 2.2
- **编程语言**: Rust (>= 1.80)
- **HTTP 客户端**: Reqwest
- **JSON 处理**: Serde

## 📁 项目结构

```
open-NGA-client/
├── src/                    # Vue 3 前端源码
│   ├── views/             # 页面视图
│   │   ├── Home/          # 首页
│   │   ├── Cookie/        # 账号登录（扫码+手动）
│   │   ├── Forum/         # 板块列表
│   │   ├── Thread/        # 主题列表
│   │   └── Post/          # 帖子详情
│   ├── stores/            # Pinia 状态管理
│   ├── api/               # API 接口层
│   ├── utils/             # 工具函数（表情解析等）
│   └── router/            # 路由配置
│
├── src-tauri/              # Tauri 后端 (Rust)
│   ├── src/
│   │   ├── commands/       # Tauri 命令 (IPC 接口)
│   │   └── lib.rs          # 库文件
│   ├── icons/             # 应用图标
│   └── Cargo.toml         # Rust 依赖配置
│
├── doc/                    # 项目文档
├── public/                 # 静态资源
├── vite.config.ts         # Vite 配置
├── uno.config.ts          # UnoCSS 配置
└── tauri.conf.json        # Tauri 配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Rust >= 1.80.0
- WebView2 (Windows)

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm tauri dev
```

或者使用无代理模式：

```powershell
.\dev-no-proxy.ps1
```

### 构建桌面应用

```bash
pnpm tauri build
```

## 🎯 核心功能说明

### 扫码登录
- 生成 NGA 官方二维码
- 手机 NGA 客户端扫码登录
- 自动获取完整 Cookie 信息
- 支持手动输入 Cookie（备用方案）

### 板块管理
- 搜索并添加板块
- 从 NGA 收藏导入
- 拖拽排序板块
- 一键删除板块

### 帖子浏览
- 支持 NGA BBCode 解析
- 表情、图片本地化显示
- 引用块高亮显示
- 楼层跳转功能
- 无限滚动加载

## 📝 开发规范

### Git 提交规范
```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建/工具变动
```

### 代码风格
- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 官方风格指南
- 使用 ESLint + Prettier 格式化代码

## 🔐 隐私说明

本应用仅为 NGA 论坛的第三方客户端，所有数据均直接从 NGA 服务器获取，不收集任何用户信息。

## 📄 License

MIT License

---

**⚠️ 注意**: 本项目为学习项目，代码质量可能不够规范，欢迎提出 Issue 和 PR！

---

## 启动方式

源码启动根目录执行：`pnpm tauri dev` 或者 `.\dev-no-proxy.ps1`

---

## ⚠ 警告

本仓库包含以下内容：
- 编码特别不规范
- 严重 vibe coding（本仓库所使用技术，笔者都谈不上熟悉）

---

## 🐛 Bugfix

- bugfix：修复帖子展示用户名称异常问题
- bugfix：修复帖子展示时间异常问题
- bugfix：修复 nga 表情加载异常问题

---

## 📋 计划实现

- 从收藏的板块中直接导入到左侧板块 ✅ (已实现)
- 针对帖子的回复功能
- 针对某个帖子，只展示图片，或者只展示字数超过50字的
- 帖子的导出
- 左侧帖子顺序修改功能
- 针对板块图标的兼容展示
- 夜间主题适配
