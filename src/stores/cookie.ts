import { defineStore } from 'pinia'
import { ref } from 'vue'
import { cookieApi } from '@/api'

export type ConnectionStatus = 'not-set' | 'set' | 'connected'

export const useCookieStore = defineStore('cookie', () => {
  const cookie = ref<string>('')
  const connectionStatus = ref<ConnectionStatus>('not-set')
  const loading = ref(false)

  // 初始化：从后端配置文件加载 Cookie
  const init = async () => {
    loading.value = true
    try {
      cookie.value = await cookieApi.get()
      connectionStatus.value = cookie.value ? 'set' : 'not-set'
    } catch (error) {
      console.error('加载 Cookie 失败:', error)
      connectionStatus.value = 'not-set'
    } finally {
      loading.value = false
    }
  }

  // 设置 Cookie（保存到后端配置文件）
  const setCookie = async (newCookie: string) => {
    loading.value = true
    try {
      await cookieApi.set(newCookie)
      cookie.value = newCookie
      connectionStatus.value = 'set'
    } catch (error) {
      console.error('设置 Cookie 失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 清除 Cookie
  const clearCookie = async () => {
    loading.value = true
    try {
      await cookieApi.clear()
      cookie.value = ''
      connectionStatus.value = 'not-set'
    } catch (error) {
      console.error('清除 Cookie 失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新连接状态
  const setConnectionStatus = (status: ConnectionStatus) => {
    connectionStatus.value = status
  }

  // 检查是否已设置 Cookie
  const hasCookie = () => {
    return !!cookie.value
  }

  // 获取状态文本
  const getStatusText = () => {
    switch (connectionStatus.value) {
      case 'not-set':
        return 'Cookie 未设置'
      case 'set':
        return 'Cookie 已设置'
      case 'connected':
        return '连接正常'
    }
  }

  // 获取状态类型
  const getStatusType = () => {
    switch (connectionStatus.value) {
      case 'not-set':
        return 'info'
      case 'set':
        return 'warning'
      case 'connected':
        return 'success'
    }
  }

  return {
    cookie,
    connectionStatus,
    loading,
    init,
    setCookie,
    clearCookie,
    setConnectionStatus,
    hasCookie,
    getStatusText,
    getStatusType,
  }
})
