import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NgaForum } from '@/config/env'
import { userConfigApi, type AppConfig } from '@/api'

export const useForumStore = defineStore('forum', () => {
  // 我的收藏板块列表
  const myForums = ref<NgaForum[]>([])
  // 所有板块列表（用于选择）
  const allForums = ref<NgaForum[]>([])
  // 当前选中的板块
  const currentForum = ref<NgaForum | null>(null)
  const loading = ref(false)

  // 从后端配置文件加载
  const loadFromConfig = async () => {
    loading.value = true
    try {
      const config: AppConfig = await userConfigApi.get()
      // 转换格式
      myForums.value = config.my_forums.map(f => ({
        fid: f.fid,
        name: f.name,
        description: f.description,
      }))

      // 设置当前选中的板块
      if (config.current_forum_fid) {
        const found = myForums.value.find(f => f.fid === config.current_forum_fid)
        if (found) {
          currentForum.value = found
        }
      }
    } catch (error) {
      console.error('加载用户配置失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 添加板块（保存到后端配置文件）
  const addForum = async (forum: NgaForum) => {
    try {
      await userConfigApi.addForum({
        fid: forum.fid,
        name: forum.name,
        description: forum.description,
      })
      myForums.value.push(forum)
      return true
    } catch (error) {
      console.error('添加板块失败:', error)
      return false
    }
  }

  // 删除板块
  const removeForum = async (fid: number) => {
    try {
      await userConfigApi.removeForum(fid)
      const index = myForums.value.findIndex(f => f.fid === fid)
      if (index > -1) {
        myForums.value.splice(index, 1)
        if (currentForum.value?.fid === fid) {
          currentForum.value = null
        }
      }
      return true
    } catch (error) {
      console.error('删除板块失败:', error)
      return false
    }
  }

  // 设置所有板块列表
  const setAllForums = (forums: NgaForum[]) => {
    allForums.value = forums
  }

  // 设置当前选中板块（保存到后端配置文件）
  const setCurrentForum = async (forum: NgaForum | null) => {
    currentForum.value = forum
    try {
      await userConfigApi.setCurrentForum(forum?.fid ?? null)
    } catch (error) {
      console.error('保存当前板块失败:', error)
    }
  }

  // 是否为空
  const isEmpty = computed(() => myForums.value.length === 0)

  return {
    myForums,
    allForums,
    currentForum,
    loading,
    isEmpty,
    loadFromConfig,
    addForum,
    removeForum,
    setAllForums,
    setCurrentForum,
  }
})
