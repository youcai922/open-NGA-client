<template>
  <div class="search-container h-full flex flex-col">
    <!-- 搜索栏 -->
    <div class="search-bar h-14 flex items-center justify-between px-4 bg-white border-b flex-shrink-0">
      <div class="flex items-center gap-2 flex-1">
        <el-button class="icon-btn" @click="goBack" title="返回">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </el-button>
        <el-input
          ref="searchInputRef"
          v-model="searchKeyword"
          placeholder="搜索帖子"
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <el-button
              class="search-btn"
              @click="handleSearch"
              title="搜索"
            >
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </el-button>
          </template>
        </el-input>
      </div>
      <div class="flex items-center gap-2">
        <el-button
          size="small"
          @click="switchToGlobalSearch"
        >
          全局搜索
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content flex-1 overflow-auto" ref="contentRef">
      <!-- 空状态 -->
      <div v-if="!hasSearched" class="empty-state h-full flex flex-col items-center justify-center text-gray-400">
        <span class="i-carbon-search text-6xl mb-4" />
        <p class="text-lg mb-2">{{ isGlobalSearch ? '全局搜索' : '板块搜索' }}</p>
        <p class="text-sm">{{ isGlobalSearch ? '输入关键词搜索所有板块' : '在当前板块内搜索' }}</p>
      </div>

      <!-- 加载中（首次） -->
      <div v-else-if="loading && threads.length === 0" class="flex justify-center py-12">
        <el-icon class="is-loading"><span class="i-carbon-circle-notch text-3xl" /></el-icon>
      </div>

      <!-- 搜索结果 -->
      <div v-else-if="threads.length > 0" class="thread-list p-4">
        <div class="result-info text-xs text-gray-500 mb-3">
          找到 <span class="text-blue-500 font-medium">{{ threads.length }}</span> 个结果
        </div>
        <div
          v-for="thread in threads"
          :key="thread.tid"
          class="thread-item p-3 mb-2 bg-white rounded border hover:shadow-sm cursor-pointer transition-shadow"
          @click="goToThread(thread.tid)"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="thread-subject text-sm font-medium truncate flex-1">{{ thread.subject }}</div>
            <div class="thread-meta text-xs text-gray-500 flex items-center gap-2 flex-shrink-0">
              <span
                v-if="thread.fid"
                class="forum-tag px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
              >
                {{ thread.forum }}
              </span>
              <span>{{ thread.replies }}回复</span>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="loadingMore" class="flex justify-center py-4">
          <el-icon class="is-loading"><span class="i-carbon-circle-notch text-xl" /></el-icon>
        </div>

        <!-- 没有更多了 -->
        <div v-else-if="!hasMore" class="text-center py-4 text-gray-400 text-sm">
          没有更多结果了
        </div>
      </div>

      <!-- 无结果 -->
      <div v-else class="text-center py-12 text-gray-400">
        <p>未找到相关结果</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ngaApiRequest } from '@/api/nga'
import { ElMessage } from 'element-plus'

// 定义组件名称，用于 keep-alive
defineOptions({
  name: 'Search'
})

const router = useRouter()
const route = useRoute()

const searchInputRef = ref<HTMLElement | null>(null)
const searchKeyword = ref('')
const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const contentRef = ref<HTMLElement | null>(null)
const hasSearched = ref(false)

// 滚动位置记录
const scrollPosition = ref(0)

// 搜索范围：默认板块搜索
const currentFid = ref<number | undefined>(undefined)
const forumName = ref('')

// 全局搜索状态
const isGlobalSearchMode = ref(false)

const isGlobalSearch = computed(() => isGlobalSearchMode.value)

interface Thread {
  tid: number
  subject: string
  forum: string
  fid?: number
  replies: number
  lastPost: number
}

const threads = ref<Thread[]>([])

// 执行搜索
const handleSearch = async () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  // 检查是否有板块或全局搜索
  if (!currentFid.value && !isGlobalSearchMode.value) {
    ElMessage.info('请点击"全局搜索"按钮或从板块页面进入')
    return
  }

  currentPage.value = 1
  hasMore.value = true
  threads.value = []
  hasSearched.value = true

  await loadThreads(true)
}

// 加载搜索结果
const loadThreads = async (isFirstPage: boolean = false) => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return

  if (isFirstPage) {
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const response = await ngaApiRequest.searchThreads({
      key: keyword,
      fid: currentFid.value,
      page: currentPage.value,
    })

    if (response.success && response.body) {
      const data = parseThreadList(response.body)

      if (isFirstPage) {
        threads.value = data.threads
      } else {
        threads.value = [...threads.value, ...data.threads]
      }

      hasMore.value = data.threads.length >= 20
    } else {
      ElMessage.error('搜索失败')
    }
  } catch (error: any) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 解析搜索结果
const parseThreadList = (body: string): { threads: Thread[] } => {
  const threads: Thread[] = []

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(body, 'text/html')

    const topicRows = doc.querySelectorAll('.topicrow')

    // 确定起始索引
    let startIndex = 0
    if (topicRows.length > 0) {
      const firstRow = topicRows[0] as Element
      const hasTopicLink = firstRow.querySelector('a.topic')
      startIndex = hasTopicLink ? 0 : 1
    }

    for (let i = startIndex; i < topicRows.length; i++) {
      const row = topicRows[i] as Element

      const topicLink = row.querySelector('a.topic')
      if (!topicLink) continue

      const href = topicLink.getAttribute('href') || ''
      const tidMatch = href.match(/tid=([^&]+)/)
      const tid = tidMatch ? parseInt(tidMatch[1]) : 0

      const subject = topicLink.textContent?.trim() || ''

      // 查找板块
      let forum = '未知板块'
      let fid: number | undefined
      const forumLink = row.querySelector('a.forum')
      if (forumLink) {
        forum = forumLink.textContent?.trim() || '未知板块'
        const forumHref = forumLink.getAttribute('href') || ''
        const fidMatch = forumHref.match(/fid=([^&]+)/)
        fid = fidMatch ? parseInt(fidMatch[1]) : undefined
      }

      // 查找回复数
      const repliesElement = row.querySelector('.replies')
      const repliesText = repliesElement?.textContent?.trim() || '0'
      const replies = parseInt(repliesText) || 0

      if (tid && subject) {
        threads.push({
          tid,
          subject,
          forum,
          fid,
          replies,
          lastPost: 0,
        })
      }
    }
  } catch (error) {
    console.error('解析搜索结果失败:', error)
  }

  return { threads }
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

// 切换到全局搜索
const switchToGlobalSearch = () => {
  isGlobalSearchMode.value = true
  currentFid.value = undefined
  forumName.value = ''

  // 如果已经搜索过，重新执行全局搜索
  if (hasSearched.value && searchKeyword.value) {
    currentPage.value = 1
    threads.value = []
    loadThreads(true)
  }
}

// 跳转到帖子详情
const goToThread = (tid: number) => {
  router.push({ name: 'Thread', params: { tid } })
}

// 返回
const goBack = () => {
  // 如果是板块搜索模式，返回板块页面；否则返回首页
  if (!isGlobalSearchMode.value) {
    router.push('/forum')
  } else {
    router.push('/')
  }
}

onMounted(async () => {
  // 添加滚动监听
  if (contentRef.value) {
    contentRef.value.addEventListener('scroll', handleScroll)
  }

  // 获取参数
  const keyword = route.query.keyword as string
  const fid = route.query.fid ? Number(route.query.fid) : undefined
  const forum = route.query.forum as string

  // 如果有板块参数，设置板块搜索模式
  if (fid) {
    currentFid.value = fid
    forumName.value = forum || `板块${fid}`
    isGlobalSearchMode.value = false
  } else {
    // 没有板块参数，默认等待用户操作
    isGlobalSearchMode.value = false
  }

  if (keyword) {
    searchKeyword.value = keyword
    // 如果有板块才自动执行搜索
    if (fid) {
      await nextTick()
      handleSearch()
    } else {
      // 没有板块时提示用户
      ElMessage.info('请先切换到全局搜索或从板块页面进入')
    }
  }

  // 聚焦搜索框
  await nextTick()
  const inputEl = searchInputRef.value?.querySelector('input')
  if (inputEl) {
    inputEl.focus()
  }
})

// 组件被激活时（从 keep-alive 缓存恢复）
onActivated(async () => {
  // 恢复滚动位置（需要等待 DOM 完全渲染）
  await nextTick()
  setTimeout(() => {
    if (contentRef.value && scrollPosition.value > 0) {
      contentRef.value.scrollTop = scrollPosition.value
    }
  }, 50)
})

onUnmounted(() => {
  if (contentRef.value) {
    contentRef.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.search-container {
  background: #f8fafc;
}

.icon-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  background: white;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.btn-icon {
  width: 16px;
  height: 16px;
  stroke: #475569;
}

.search-input {
  flex: 1;
  max-width: 500px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.search-btn {
  border: none;
  background: transparent;
  padding: 4px;
}

.search-btn:hover {
  background: transparent;
}

.search-icon {
  width: 16px;
  height: 16px;
  stroke: #64748b;
}

.forum-tag {
  position: relative;
  padding-right: 20px;
}

.close-icon {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.6;
}

.close-icon:hover {
  opacity: 1;
}

.thread-item:hover {
  border-color: #3b82f6;
}
</style>
