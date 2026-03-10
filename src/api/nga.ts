import { invoke } from '@tauri-apps/api/core'
import { ngaConfig } from '@/config/env'
import { cookieApi } from '.'

// API 响应类型定义
export interface NgaApiResponse {
  success: boolean
  status?: number
  body?: string
  error?: string
}

// 代理图片响应类型
export interface ProxyImageResponse {
  success: boolean
  data_url?: string
  error?: string
}

// 日志输出（已禁用）
const log = {
  info: (..._args: any[]) => {},
  error: (...args: any[]) => console.error('[NGA API Error]', ...args),
  request: (_url: string, _cookie: string) => {},
  response: (_response: any) => {},
  invokeStart: (_command: string, _params: any) => {},
  invokeEnd: (_command: string, _result: any) => {},
  invokeError: (command: string, error: any) => {
    console.error('[NGA API Invoke Error]', command, error)
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

  const params = { url, cookie }
  log.invokeStart('nga_http_request', params)

  try {
    const response = await invoke('nga_http_request', params)
    log.invokeEnd('nga_http_request', response)
    log.response(response)
    return response
  } catch (error) {
    log.invokeError('nga_http_request', error)
    throw error
  }
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

  // 获取用户发布的帖子 (thread.php?authorid=xxx)
  getUserThreads: async (params: { authorid: string; page?: string }) => {
    const url = buildUrl(ngaConfig.apiPaths.thread, params)
    return rustRequest(url.toString())
  },

  // 搜索帖子 (thread.php?key=xxx&fid=xxx)
  searchThreads: async (params: { key: string; fid?: number; page?: number }) => {
    const searchParams: Record<string, string> = {
      key: params.key,
      content: '4', // 搜索范围：4=搜索帖子内容
    }
    if (params.fid !== undefined) {
      searchParams.fid = params.fid.toString()
    }
    if (params.page !== undefined) {
      searchParams.page = params.page.toString()
    }
    const url = buildUrl(ngaConfig.apiPaths.thread, searchParams)
    return rustRequest(url.toString())
  },

  // 发表回复 (misc.php)
  postReply: async (_data: any) => {
    // POST 请求暂不实现，需要更新 Rust 端
    throw new Error('POST not implemented yet')
  },

  // 代理获取图片
  proxyImage: async (imageUrl: string): Promise<ProxyImageResponse> => {
    try {
      const response = await invoke('proxy_image', { url: imageUrl }) as ProxyImageResponse
      return response
    } catch (error) {
      console.error('代理图片失败:', error)
      throw error
    }
  },
}

export default ngaApiRequest
