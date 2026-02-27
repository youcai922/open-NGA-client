# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

open-NGA-client 是一个 NGA 论坛的本地桌面客户端工具，基于 Tauri 2.2 + Vue 3.5 构建。

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式（带热重载，启动 Tauri 应用）
pnpm tauri dev

# 构建桌面应用
pnpm tauri build

# 仅运行前端开发服务器
pnpm dev

# 类型检查
pnpm type-check

# 代码格式化
pnpm format
```

## 技术架构

### 前端 (Vue 3)
- **框架**: Vue 3.5 (Composition API)
- **UI 组件**: Element Plus 2.9
- **样式**: UnoCSS 0.65 (原子化 CSS)
- **状态管理**: Pinia 2.2
- **路由**: Vue Router 4.5
- **HTTP**: Axios 1.7
- **构建**: Vite 6.0

### 后端 (Tauri + Rust)
- **桌面框架**: Tauri 2.2
- **后端语言**: Rust (>= 1.80)

### 目录结构（规划中）

```
open-NGA-client/
├── src-tauri/              # Tauri 后端 (Rust)
│   ├── src/
│   │   ├── main.rs         # Rust 入口
│   │   ├── lib.rs          # 库文件
│   │   └── commands/       # Tauri 命令 (IPC 接口)
│   ├── Cargo.toml          # Rust 依赖配置
│   └── tauri.conf.json     # Tauri 配置
│
├── src/                    # Vue 3 前端
│   ├── components/
│   │   ├── layout/         # 布局组件
│   │   └── common/         # 通用组件
│   ├── views/              # 页面视图
│   │   ├── Home/           # 首页
│   │   ├── Forum/          # 版块列表
│   │   ├── Thread/         # 主题列表
│   │   └── Post/           # 帖子详情
│   ├── router/             # 路由配置
│   ├── stores/             # Pinia 状态管理
│   ├── api/                # API 接口层
│   ├── utils/              # 工具函数
│   ├── App.vue
│   └── main.ts
│
├── doc/                    # 项目文档
├── vite.config.ts
└── uno.config.ts
```

## 开发规范

### robots.txt 协议遵守

在访问 NGA 论坛接口或爬取数据时，必须遵守 NGA 的 robots.txt 协议：

**禁止访问的路径：**
- `/admin/` - 管理后台
- `/attachment/` - 附件目录
- `/image/` - 图片目录
- `/data/` - 数据目录
- `/ipdata/` - IP数据目录
- `/template/` - 模板目录
- `/require/` - 依赖文件目录

**禁止爬取的文件类型：**
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp` - 图片文件

在实现 API 调用时，应避免访问以上路径。

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

## 环境要求

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Rust >= 1.80.0
- WebView2 (Windows)

## Tauri IPC 通信

前端通过 `@tauri-apps/api/core` 的 `invoke` 函数调用 Rust 后端命令：

```typescript
// 前端调用
import { invoke } from '@tauri-apps/api/core';
const result = await invoke('command_name', { param1: value1 });
```

Rust 后端通过 `#[tauri::command]` 宏定义命令：

```rust
#[tauri::command]
fn command_name(param1: String) -> Result<String, String> {
    // 处理逻辑
    Ok("result".to_string())
}
```
