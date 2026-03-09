# 快速开始指南

本文档将帮助你快速搭建和运行 open-NGA-client 项目。

## 📋 目录

- [环境要求](#环境要求)
- [安装依赖](#安装依赖)
- [开发模式](#开发模式)
- [构建应用](#构建应用)
- [常见问题](#常见问题)

## 环境要求

在开始之前，请确保你的开发环境满足以下要求：

### 必需环境

| 环境 | 最低版本 | 推荐版本 | 说明 |
|------|---------|---------|------|
| Node.js | 20.0.0 | 最新 LTS | [下载地址](https://nodejs.org/) |
| pnpm | 9.0.0 | 最新版 | 使用 `npm install -g pnpm` 安装 |
| Rust | 1.80.0 | 最新稳定版 | [下载地址](https://www.rust-lang.org/) |

### Windows 用户

需要安装 **WebView2**（Windows 10/11 通常已预装）：
- [下载 WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

### 验证安装

```bash
# 检查 Node.js 版本
node --version

# 检查 pnpm 版本
pnpm --version

# 检查 Rust 版本
rustc --version

# 检查 Cargo 版本
cargo --version
```

## 安装依赖

### 1. 克隆项目

```bash
git clone https://github.com/youcai922/open-NGA-client.git
cd open-NGA-client
```

### 2. 安装前端依赖

```bash
pnpm install
```

这将安装所有前端依赖，包括 Vue 3、Element Plus、Tauri API 等。

安装过程可能需要几分钟，取决于你的网络速度。

## 开发模式

### 方式一：使用 pnpm 脚本（推荐）

```bash
pnpm tauri dev
```

这将启动开发模式，包括：
- 前端开发服务器（带热重载）
- Tauri 后端编译和运行
- 自动打开应用窗口

### 方式二：无代理模式（Windows）

如果遇到网络问题，可以使用无代理模式：

```powershell
.\dev-no-proxy.ps1
```

### 开发模式说明

- 前端运行在 `http://localhost:1420`
- 修改前端代码会自动热重载
- 修改 Rust 代码需要重新编译（会自动触发）

## 构建应用

### 开发构建

```bash
pnpm tauri build
```

这将生成可执行文件：
- **Windows**: `src-tauri/target/release/bundle/`

### 生产构建

```bash
# 先构建前端
pnpm build

# 再构建 Tauri 应用
pnpm tauri build
```

### 构建产物

构建完成后，可在以下目录找到安装包：

| 平台 | 目录位置 |
|------|---------|
| Windows | `src-tauri/target/release/<app-name>-setup.exe` |
| macOS | `src-tauri/target/release/bundle/dmg/<app-name>.dmg` |
| Linux | `src-tauri/target/release/bundle/deb/<app-name>_<version>_amd64.deb` |

## 常见问题

### Q1: pnpm install 报错

**问题**: 安装依赖时出现网络超时或下载失败

**解决方案**:
```bash
# 使用国内镜像
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

### Q2: Rust 编译报错

**问题**: `error: linker`link.exe`` not found

**解决方案**:
- Windows: 安装 [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- 或安装 Visual Studio 2022 并选择"使用 C++ 的桌面开发"工作负载

### Q3: WebView2 相关错误

**问题**: 应用启动后显示白屏或崩溃

**解决方案**:
- 确保已安装 [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
- Windows 10/11 用户通常已预装，可忽略此步骤

### Q4: Tauri CLI 报错

**问题**: `tauri-cli` 相关错误

**解决方案**:
```bash
# 重新安装 Tauri CLI
pnpm remove @tauri-apps/cli
pnpm add -D @tauri-apps/cli@latest
```

### Q5: 应用窗口大小异常

**问题**: 应用窗口显示不正常

**解决方案**:
检查 `src-tauri/tauri.conf.json` 中的窗口配置：
```json
{
  "window": {
    "width": 1200,
    "height": 800,
    "minWidth": 800,
    "minHeight": 600
  }
}
```

## 项目结构

```
open-NGA-client/
├── src/                    # Vue 3 前端源码
│   ├── api/               # API 接口层
│   ├── components/        # Vue 组件
│   ├── config/            # 配置文件
│   ├── router/            # 路由配置
│   ├── stores/            # Pinia 状态管理
│   ├── utils/             # 工具函数
│   ├── views/             # 页面视图
│   └── main.ts            # 入口文件
├── src-tauri/             # Tauri 后端源码（Rust）
│   ├── src/               # Rust 源码
│   ├── Cargo.toml         # Rust 依赖配置
│   └── tauri.conf.json    # Tauri 配置
├── public/                # 静态资源
├── CHANGELOG.md           # 更新日志
├── README.md              # 项目说明
└── QUICKSTART.md          # 快速开始（本文件）
```

## 下一步

- 📖 阅读 [README.md](./README.md) 了解项目功能
- 🔧 查看 [CLAUDE.md](./CLAUDE.md) 了解开发规范
- 📝 查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新

## 获取帮助

如果遇到其他问题：

1. 查看 [Issues](https://github.com/youcai922/open-NGA-client/issues) 是否有类似问题
2. 提交新的 [Issue](https://github.com/youcai922/open-NGA-client/issues/new)
3. 加入讨论：[项目 Discussions](https://github.com/youcai922/open-NGA-client/discussions)
