<template>
  <div class="user-threads-container h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="header h-12 flex items-center justify-between px-4 bg-gray-100 border-b flex-shrink-0">
      <div class="flex items-center gap-2">
        <el-button class="icon-btn" @click="goBack" title="返回">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </el-button>
        <h2 class="text-base font-medium">{{ username }} 的帖子</h2>
      </div>
      <div class="flex items-center gap-2">
        <el-button class="icon-btn" @click="openInBrowser" title="在浏览器中打开">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </el-button>
        <el-button class="icon-btn" @click="refreshThreads" :loading="loading && threads.length === 0" title="刷新">
          <svg v-if="!loading || threads.length > 0" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content flex-1 overflow-auto" ref="contentRef">
      <!-- 加载中（首次） -->
      <div v-if="loading && threads.length === 0" class="flex justify-center py-12">
        <el-icon class="is-loading"><span class="i-carbon-circle-notch text-3xl" /></el-icon>
      </div>

      <!-- 帖子列表 -->
      <div v-else-if="threads.length > 0" class="thread-list p-4">
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
                class="forum-tag px-2 py-0.5 bg-gray-100 text-gray-600 rounded cursor-pointer hover:bg-gray-200 transition-colors"
                @click.stop="goToForum(thread.fid, thread.forum)"
              >
                {{ thread.forum }}
              </span>
              <span v-else class="forum-tag px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
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
          没有更多帖子了
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-12 text-gray-400">
        <p>暂无帖子</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'
import { ngaApiRequest } from '@/api/nga'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const contentRef = ref<HTMLElement | null>(null)

const username = ref('')
const authorId = ref<number>(0)

interface Thread {
  tid: number
  subject: string
  forum: string
  fid?: number
  replies: number
  lastPost: number
}

const threads = ref<Thread[]>([])

// 用户帖子列表 URL
const userThreadsUrl = computed(() => `https://bbs.nga.cn/thread.php?authorid=${authorId.value}`)

// 加载帖子列表
const loadThreads = async (isFirstPage: boolean = false) => {
  if (!authorId.value) return

  if (isFirstPage) {
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const response = await ngaApiRequest.getUserThreads({
      authorid: authorId.value.toString(),
      page: currentPage.value.toString(),
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
      ElMessage.error('获取帖子列表失败')
    }
  } catch (error: any) {
    console.error('获取帖子列表失败:', error)
    ElMessage.error('获取帖子列表失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 解析帖子列表
const parseThreadList = (body: string): { threads: Thread[] } => {
  const threads: Thread[] = []

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(body, 'text/html')

    // 调试：输出整个body的前1000个字符
    console.log('HTML body preview:', body.substring(0, 1000))

    // 查找所有 topicrow 元素
    const topicRows = doc.querySelectorAll('.topicrow')
    console.log('Found topic rows:', topicRows.length)

    // 确定起始索引：检查第一个是否有有效的帖子链接
    let startIndex = 0
    if (topicRows.length > 0) {
      const firstRow = topicRows[0] as Element
      const hasTopicLink = firstRow.querySelector('a.topic')
      // 如果第一个有帖子链接，说明没有表头，从0开始
      if (hasTopicLink) {
        startIndex = 0
      } else {
        startIndex = 1 // 跳过表头
      }
    }

    for (let i = startIndex; i < topicRows.length; i++) {
      const row = topicRows[i] as Element

      // 调试：输出第一个实际row的完整HTML
      if (i === startIndex) {
        console.log('First topic row HTML:', row.innerHTML)
      }

      // 查找主题链接
      const topicLink = row.querySelector('a.topic')
      if (!topicLink) {
        console.log('Row', i, 'no topic link found')
        continue
      }

      // 获取 href 并提取 tid
      const href = topicLink.getAttribute('href') || ''
      const tidMatch = href.match(/tid=([^&]+)/)
      const tid = tidMatch ? parseInt(tidMatch[1]) : 0

      // 获取标题
      const subject = topicLink.textContent?.trim() || ''

      // 查找板块 - 尝试多种方式
      let forumLink: Element | null = null
      let forum = '未知板块'
      let fid: number | undefined

      // 方法1：查找 a.forum
      forumLink = row.querySelector('a.forum')
      if (forumLink) {
        forum = forumLink.textContent?.trim() || '未知板块'
        const forumHref = forumLink.getAttribute('href') || ''
        const fidMatch = forumHref.match(/fid=([^&]+)/)
        fid = fidMatch ? parseInt(fidMatch[1]) : undefined
      }

      // 方法2：如果没找到，尝试从 topicrow 的所有链接中查找包含 fid 的链接
      if (!forumLink) {
        const allLinks = row.querySelectorAll('a')
        for (const link of Array.from(allLinks)) {
          const href = link.getAttribute('href') || ''
          if (href.includes('fid=') && !href.includes('tid=')) {
            forum = link.textContent?.trim() || '未知板块'
            const fidMatch = href.match(/fid=([^&]+)/)
            fid = fidMatch ? parseInt(fidMatch[1]) : undefined
            break
          }
        }
      }

      // 方法3：如果还是没找到，尝试从 topicrow 的类名或属性中提取
      if (!fid) {
        // 某些情况下板块信息可能在 row 的 data 属性或 class 中
        const dataFid = row.getAttribute('data-fid')
        if (dataFid) {
          fid = parseInt(dataFid)
        }
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
    console.error('解析帖子列表失败:', error)
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

  // 当滚动到距离底部 100px 时，加载更多
  if (scrollHeight - scrollTop - clientHeight < 100) {
    loadMore()
  }
}

// 刷新列表
const refreshThreads = async () => {
  currentPage.value = 1
  hasMore.value = true
  threads.value = []
  await loadThreads(true)

  // 刷新后恢复滚动位置到顶部
  if (contentRef.value) {
    contentRef.value.scrollTop = 0
  }
}

// 跳转到帖子详情
const goToThread = (tid: number) => {
  router.push({ name: 'Thread', params: { tid } })
}

// 返回
const goBack = () => {
  router.back()
}

// 跳转到板块
const goToForum = async (fid: number, _forumName: string) => {
  // 直接在浏览器中打开该板块
  try {
    await invoke('open_url', { url: `https://bbs.nga.cn/thread.php?fid=${fid}` })
  } catch (error) {
    console.error('打开浏览器失败:', error)
  }
}

// 在浏览器中打开
const openInBrowser = async () => {
  try {
    await invoke('open_url', { url: userThreadsUrl.value })
    ElMessage.success('已在浏览器中打开')
  } catch (error) {
    console.error('打开浏览器失败:', error)
    ElMessage.error('打开浏览器失败: ' + (error as string))
  }
}

onMounted(async () => {
  // 获取参数
  authorId.value = Number(route.params.authorId)
  username.value = (route.query.username as string) || '用户'

  // 添加滚动监听
  if (contentRef.value) {
    contentRef.value.addEventListener('scroll', handleScroll)
  }

  // 加载帖子列表
  await loadThreads(true)
})

onUnmounted(() => {
  if (contentRef.value) {
    contentRef.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.user-threads-container {
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

.icon-btn:active {
  background: #f3f4f6;
}

.icon-btn.is-loading {
  background: white;
}

.btn-icon {
  width: 16px;
  height: 16px;
  stroke: #475569;
}

.thread-item:hover {
  border-color: #3b82f6;
}
</style>
