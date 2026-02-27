import { invoke } from '@tauri-apps/api/core'
import { ngaConfig } from '@/config/env'
import { cookieApi } from '.'

// 日志输出
const log = {
  info: (...args: any[]) => console.log('[NGA API Info]', ...args),
  error: (...args: any[]) => console.error('[NGA API Error]', ...args),
  request: (url: string, cookie: string) => {
    console.log('[NGA API Request]')
    console.log('  URL:', url)
    console.log('  Cookie length:', cookie.length)
    console.log('  Cookie preview:', cookie.substring(0, 50) + '...')
  },
  response: (response: any) => {
    console.log('[NGA API Response]')
    console.log('  Success:', response.success)
    console.log('  Status:', response.status)
    console.log('  Body length:', response.body?.length || 0)
  },
}

// 获取 Cookie（从后端配置文件，带缓存）
let cachedCookie: string | null = null
const getCookie = async () => {
  if (cachedCookie !== null) {
    return cachedCookie
  }
  try {
    cachedCookie = await cookieApi.get()
    return cachedCookie
  } catch (error) {
    console.error('获取 Cookie 失败:', error)
    return ''
  }
}

// 清除 Cookie 缓存（在设置/清除 Cookie 后调用）
export const clearCookieCache = () => {
  cachedCookie = null
}

// 构建带参数的 URL
const buildUrl = (path: string, params?: any) => {
  const url = new URL(path, ngaConfig.baseUrl)
  if (params) {
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined) {
        url.searchParams.append(key, String(params[key]))
      }
    })
  }
  return url
}

// 使用 Rust 端发送 HTTP 请求
const rustRequest = async (url: string): Promise<any> => {
  const cookie = await getCookie()

  log.request(url, cookie)

  const response = await invoke('nga_http_request', {
    request: {
      url,
      cookie,
    },
  })

  log.response(response)

  return response
}

// NGA API 接口
export const ngaApiRequest = {
  // 获取所有版块列表
  getForumList: async () => {
    // 使用 NGA 的板块数据接口
    const url = 'https://img4.nga.178.com/proxy/cache_attach/bbs_index_data.js'
    return rustRequest(url)
  },

  // 获取收藏版块 (nuke.php)
  getFavoriteForums: async () => {
    const url = buildUrl(ngaConfig.apiPaths.nuke, {
      __lib: 'forum_favor2',
      __act: 'forum_favor',
      __output: 3, // JSON 格式输出
    })
    return rustRequest(url.toString())
  },

  // 获取主题列表 (thread.php)
  getThreadList: async (params: any) => {
    const url = buildUrl(ngaConfig.apiPaths.thread, params)
    return rustRequest(url.toString())
  },

  // 获取帖子详情 (read.php)
  getPostDetail: async (params: any) => {
    const url = buildUrl(ngaConfig.apiPaths.post, params)
    return rustRequest(url.toString())
  },

  // 发表回复 (misc.php)
  postReply: async (_data: any) => {
    // POST 请求暂不实现，需要更新 Rust 端
    throw new Error('POST not implemented yet')
  },
}

export default ngaApiRequest
