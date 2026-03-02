import { invoke } from '@tauri-apps/api/core'

// Cookie 相关接口
export const cookieApi = {
  // 获取 Cookie
  get: async () => {
    return await invoke<string>('get_cookie')
  },

  // 设置 Cookie
  set: async (cookie: string) => {
    return await invoke('set_cookie', { request: { cookie } })
  },

  // 清除 Cookie
  clear: async () => {
    return await invoke('clear_cookie')
  },
}

// 用户配置接口类型
export interface ForumInfo {
  fid: number
  name: string
  description?: string
}

export interface AppConfig {
  nga_cookie: string
  my_forums: ForumInfo[]
  current_forum_fid: number | null
}

// 用户配置相关接口
export const userConfigApi = {
  // 获取用户配置
  get: async (): Promise<AppConfig> => {
    return await invoke<AppConfig>('get_user_config')
  },

  // 添加板块
  addForum: async (forum: ForumInfo) => {
    return await invoke('add_forum', {
      request: {
        fid: forum.fid,
        name: forum.name,
        description: forum.description,
      },
    })
  },

  // 删除板块
  removeForum: async (fid: number) => {
    return await invoke('remove_forum', { request: { fid } })
  },

  // 设置当前选中板块
  setCurrentForum: async (fid: number | null) => {
    return await invoke('set_current_forum', { request: { fid } })
  },
}

// WebView 登录相关接口
export const webViewLoginApi = {
  // 打开/关闭 NGA 官网 WebView 窗口，返回是否打开
  toggle: async (): Promise<boolean> => {
    return await invoke<boolean>('toggle_nga_webview')
  },

  // 检查 WebView 窗口是否打开
  isOpen: async (): Promise<boolean> => {
    return await invoke<boolean>('is_webview_open')
  },

  // 检查登录状态
  checkLoginStatus: async (): Promise<boolean> => {
    return await invoke<boolean>('check_login_status')
  },

  // 显示 Cookie 获取帮助
  showCookieHelp: async (): Promise<string> => {
    return await invoke<string>('show_cookie_help')
  },

  // 从 WebView 同步 Cookie 到后端
  syncCookie: async (): Promise<string> => {
    return await invoke<string>('sync_cookie_from_webview')
  },
}

// 二维码登录接口类型
export interface QrLoginParams {
  qrkey: string
  hiddenkey: string
}

export interface QrLoginStatus {
  status: string // 'pending', 'success', 'error:...'
  uid?: number
  token?: string
  username?: string
  avatar?: string
}

export interface QrLoginResult {
  success: boolean
  uid: number
  token: string
  username: string
  avatar: string
}

// 二维码登录相关接口
export const qrLoginApi = {
  // 生成二维码登录参数
  generate: async (): Promise<QrLoginParams> => {
    return await invoke<QrLoginParams>('qr_login_generate')
  },

  // 检查二维码登录状态
  checkStatus: async (qrkey: string, hiddenkey: string): Promise<QrLoginStatus> => {
    return await invoke<QrLoginStatus>('qr_login_check', {
      qrkey,
      hiddenkey,
    })
  },

  // 设置登录后的 Cookie
  setCookie: async (uid: number, token: string): Promise<QrLoginResult> => {
    return await invoke<QrLoginResult>('qr_login_set_cookie', {
      uid,
      token,
    })
  },
}

