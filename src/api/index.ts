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

