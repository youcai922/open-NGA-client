<template>
  <div class="forum-container h-full flex flex-col">
    <!-- 主内容区 -->
    <div class="forum-content flex-1 flex overflow-hidden">
      <!-- 左侧板块列表 -->
      <div class="forum-sidebar w-56 border-r overflow-auto bg-gray-50 flex flex-col">
        <!-- 空状态 -->
        <div v-if="forumStore.isEmpty && !loading" class="empty-state flex-1 flex items-center justify-center">
          <div class="text-center">
            <span class="i-carbon-forum text-5xl text-gray-300 mb-4 block" />
            <p class="text-gray-500 text-sm mb-3">暂无收藏板块</p>
            <p class="text-gray-400 text-xs">添加板块或从收藏导入开始使用</p>
          </div>
        </div>

        <!-- 板块列表 -->
        <div v-else class="forum-list flex-1">
          <div
            v-for="forum in forumStore.myForums"
            :key="forum.fid"
            class="forum-item px-4 py-3 border-b cursor-pointer hover:bg-blue-50 transition-colors"
            :class="{ 'bg-blue-100': forumStore.currentForum?.fid === forum.fid }"
            @click="selectForum(forum)"
          >
            <div class="forum-name text-sm font-medium truncate">{{ forum.name }}</div>
            <div v-if="forum.description" class="forum-desc text-xs text-gray-500 truncate mt-1">
              {{ forum.description }}
            </div>
            <el-button
              text
              size="small"
              class="remove-btn"
              @click.stop="removeForum(forum.fid)"
            >
              <span class="i-carbon-trash-can" />
            </el-button>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="sidebar-footer">
          <el-button class="sidebar-btn" @click="showAddDialog = true">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>添加板块</span>
          </el-button>
        </div>
      </div>

      <!-- 右侧主题列表 -->
      <div class="forum-main flex-1 overflow-auto" ref="mainContainerRef">
        <!-- 未选中板块 -->
        <div v-if="!forumStore.currentForum" class="empty-forum flex items-center justify-center h-full">
          <div class="text-center text-gray-400">
            <span class="i-carbon-forum text-6xl mb-4 block" />
            <p>请选择一个板块查看主题</p>
          </div>
        </div>

        <!-- 主题列表 -->
        <div v-else class="thread-list h-full flex flex-col">
          <!-- 顶部工具栏 -->
          <div class="thread-header px-4 py-3 border-b bg-white sticky top-0 z-10 flex items-center justify-between">
            <el-button class="icon-btn" @click="goHome" title="返回首页">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </el-button>
            <div class="flex items-center gap-2">
              <el-button
                v-if="forumStore.currentForum"
                class="icon-btn"
                @click="goToSearch"
                title="搜索本板块"
              >
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </el-button>
              <el-button class="icon-btn" @click="refreshThreads" title="刷新">
                <svg v-if="!loadingThreads" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </el-button>
            </div>
          </div>

          <!-- 主题列表容器 -->
          <div class="thread-items p-4" ref="threadItemsRef" @scroll="handleScroll">
            <!-- 加载中（首次） -->
            <div v-if="loadingThreads && threads.length === 0" class="flex justify-center py-8">
              <el-icon class="is-loading"><span class="i-carbon-circle-notch text-2xl" /></el-icon>
            </div>

            <!-- 主题列表 -->
            <div v-else-if="threads.length > 0">
              <div
                v-for="thread in threads"
                :key="thread.tid"
                class="thread-item p-3 mb-2 bg-white rounded border hover:shadow-sm cursor-pointer transition-shadow"
                @click="goToThread(thread.tid)"
              >
                <div class="thread-subject text-sm font-medium mb-1">{{ thread.subject }}</div>
                <div class="thread-meta text-xs text-gray-500 flex items-center gap-3">
                  <span>{{ thread.author }}</span>
                  <span>{{ thread.replies }} 回复</span>
                </div>
              </div>

              <!-- 加载更多 -->
              <div v-if="loadingMore" class="flex justify-center py-4">
                <el-icon class="is-loading"><span class="i-carbon-circle-notch text-xl" /></el-icon>
              </div>

              <!-- 没有更多了 -->
              <div v-else-if="!hasMore" class="text-center py-4 text-gray-400 text-sm">
                没有更多主题了
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="text-center py-8 text-gray-400">
              <p>暂无主题</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加板块对话框 -->
    <AddForumDialog
      v-model="showAddDialog"
      @added="onForumAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, onActivated } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useForumStore } from '@/stores/forum'
import { ngaApiRequest } from '@/api/nga'
import { ElMessage, ElMessageBox } from 'element-plus'
import AddForumDialog from './AddForumDialog.vue'

// 定义组件名称，用于 keep-alive
defineOptions({
  name: 'Forum'
})

const router = useRouter()
const forumStore = useForumStore()

const showAddDialog = ref(false)
const loading = ref(false)
const loadingThreads = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const mainContainerRef = ref<HTMLElement | null>(null)
const threadItemsRef = ref<HTMLElement | null>(null)

// 滚动位置记录
const scrollPosition = ref(0)
const currentFid = ref<number>(0)
const isReturningFromThread = ref(false) // 标记是否从帖子详情返回

interface Thread {
  tid: number
  subject: string
  author: string
  replies: number
  last_post: number
}

const threads = ref<Thread[]>([])

// 刷新主题列表
const refreshThreads = async () => {
  currentPage.value = 1
  hasMore.value = true
  threads.value = []
  scrollPosition.value = 0
  await loadThreads(true)

  // 刷新后恢复滚动位置到顶部
  await nextTick()
  if (threadItemsRef.value) {
    threadItemsRef.value.scrollTop = 0
  }
}

// 选择板块（用户主动点击）
const selectForum = async (forum: any) => {
  isReturningFromThread.value = false // 用户主动切换板块，不是返回
  forumStore.setCurrentForum(forum)
  currentPage.value = 1
  hasMore.value = true
  threads.value = []
  scrollPosition.value = 0
  await loadThreads(true)

  // 重置滚动位置
  await nextTick()
  if (threadItemsRef.value) {
    threadItemsRef.value.scrollTop = 0
  }
}

// 加载主题列表
const loadThreads = async (isFirstPage: boolean = false) => {
  if (!forumStore.currentForum) return

  // 如果是加载更多，使用 loadingMore，否则使用 loadingThreads
  if (isFirstPage) {
    loadingThreads.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const response = await ngaApiRequest.getThreadList({
      fid: forumStore.currentForum.fid.toString(),
      page: currentPage.value.toString(),
    })

    if (response.success && response.body) {
      const data = parseThreadList(response.body)

      if (isFirstPage) {
        threads.value = data.threads
      } else {
        threads.value = [...threads.value, ...data.threads]
      }

      // 如果返回的主题少于 20 个，说明没有更多了
      hasMore.value = data.threads.length >= 20
    } else {
      console.error('获取主题列表失败')
      ElMessage.error('获取主题列表失败')
    }
  } catch (error: any) {
    console.error('获取主题列表失败:', error)
    ElMessage.error('获取主题列表失败')
  } finally {
    loadingThreads.value = false
    loadingMore.value = false
  }
}

// 加载更多
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  currentPage.value++
  await loadThreads(false)
}

// 处理滚动事件
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollHeight = target.scrollHeight
  const clientHeight = target.clientHeight

  // 记录滚动位置
  scrollPosition.value = scrollTop

  // 当滚动到距离底部 100px 时，加载更多
  if (scrollHeight - scrollTop - clientHeight < 100) {
    loadMore()
  }
}

// 解析主题列表数据
const parseThreadList = (body: string): { threads: Thread[], total: number } => {
  const threads: Thread[] = []

  try {
    // 使用 DOMParser 解析 HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(body, 'text/html')

    // 查找所有 topicrow 元素
    const topicRows = doc.querySelectorAll('.topicrow')

    // 跳过第一个（通常是表头）
    for (let i = 1; i < topicRows.length; i++) {
      const row = topicRows[i] as Element

      // 查找主题链接
      const topicLink = row.querySelector('a.topic')
      if (!topicLink) continue

      // 获取 href 并提取 tid
      const href = topicLink.getAttribute('href') || ''
      const tidMatch = href.match(/tid=([^&]+)/)
      const tid = tidMatch ? parseInt(tidMatch[1]) : 0

      // 获取标题
      const subject = topicLink.textContent?.trim() || ''

      // 查找作者和其他信息
      const authorElement = row.querySelector('.author')
      const author = authorElement?.textContent?.trim() || ''

      // 查找回复数
      const repliesElement = row.querySelector('.replies')
      const repliesText = repliesElement?.textContent?.trim() || '0'
      const replies = parseInt(repliesText) || 0

      if (tid && subject) {
        threads.push({
          tid,
          subject,
          author,
          replies,
          last_post: 0,
        })
      }
    }
  } catch (error) {
    console.error('解析主题列表失败:', error)
  }

  return { threads, total: threads.length || 100 }
}

// 删除板块
const removeForum = async (fid: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个板块吗？', '提示', {
      type: 'warning',
    })
    forumStore.removeForum(fid)
    ElMessage.success('已删除')
  } catch {
    // 取消删除
  }
}

// 跳转到主题详情
const goToThread = (tid: number) => {
  // 记录当前滚动位置和板块信息
  if (threadItemsRef.value) {
    scrollPosition.value = threadItemsRef.value.scrollTop
  }
  if (forumStore.currentForum) {
    currentFid.value = forumStore.currentForum.fid
  }

  // 标记从帖子列表进入详情
  isReturningFromThread.value = true

  router.push({ name: 'Thread', params: { tid } })
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 跳转到搜索页面（板块内搜索）
const goToSearch = () => {
  if (!forumStore.currentForum) return

  router.push({
    name: 'Search',
    query: {
      fid: forumStore.currentForum.fid.toString(),
      forum: forumStore.currentForum.name,
    },
  })
}

// 板块添加后的回调
const onForumAdded = () => {
  ElMessage.success('添加成功')
}

// 组件挂载时加载配置并选择第一个板块
onMounted(async () => {
  await forumStore.loadFromConfig()

  // 添加滚动监听
  if (threadItemsRef.value) {
    threadItemsRef.value.addEventListener('scroll', handleScroll)
  }

  // 加载板块和主题
  if (!forumStore.isEmpty && forumStore.myForums.length > 0) {
    // 确定要选中的板块
    let forumToSelect = forumStore.currentForum || forumStore.myForums[0]

    // 如果有记录的板块且不是从帖子详情返回，优先使用它
    if (currentFid.value > 0 && !isReturningFromThread.value) {
      const savedForum = forumStore.myForums.find(f => f.fid === currentFid.value)
      if (savedForum) {
        forumToSelect = savedForum
      }
    }

    // 设置当前板块
    if (forumToSelect) {
      forumStore.setCurrentForum(forumToSelect)

      // 恢复滚动位置
      await nextTick()
      if (threadItemsRef.value && scrollPosition.value > 0) {
        threadItemsRef.value.scrollTop = scrollPosition.value
      }

      // 只有在没有主题时才加载
      if (threads.value.length === 0) {
        await loadThreads(true)
      }
    }

    // 重置返回标记
    isReturningFromThread.value = false
  }
})

// 组件被激活时（从 keep-alive 缓存恢复）
onActivated(async () => {
  // 恢复滚动位置
  await nextTick()
  if (threadItemsRef.value && scrollPosition.value > 0) {
    threadItemsRef.value.scrollTop = scrollPosition.value
  }

  // 重置返回标记
  isReturningFromThread.value = false
})

// 路由离开前记录滚动位置
onBeforeRouteLeave((_to, _from, next) => {
  // 记录滚动位置
  if (threadItemsRef.value) {
    scrollPosition.value = threadItemsRef.value.scrollTop
  }
  if (forumStore.currentForum) {
    currentFid.value = forumStore.currentForum.fid
  }
  next()
})

// 组件卸载时移除滚动监听
onUnmounted(() => {
  const scrollContainer = threadItemsRef.value
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.forum-container {
  background: #f5f5f5;
}

.remove-btn {
  opacity: 0;
  transition: opacity 0.2s;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.forum-item {
  position: relative;
}

.forum-item:hover .remove-btn {
  opacity: 1;
}

.thread-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.icon-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
  background: white;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.icon-btn:active {
  background: #f3f4f6;
}

.btn-icon {
  width: 18px;
  height: 18px;
  stroke: #475569;
}

.thread-item:hover {
  border-color: #3b82f6;
}

.thread-items {
  height: 100%;
  overflow-y: auto;
}

.sidebar-footer {
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.sidebar-btn {
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #475569;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.sidebar-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.sidebar-btn:active {
  background: #f3f4f6;
}

.btn-icon {
  width: 16px;
  height: 16px;
}
</style>
