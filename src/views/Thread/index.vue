<template>
  <div class="thread-container h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="thread-header h-12 flex items-center justify-between px-4 bg-gray-100 border-b flex-shrink-0">
      <div class="flex items-center gap-2">
        <el-button class="icon-btn" @click="goBack" title="返回">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </el-button>
        <h2 class="text-base font-medium">帖子详情</h2>
        <div class="flex items-center gap-2">
          <span
            class="text-xs text-blue-500 cursor-pointer hover:text-blue-700 hover:underline max-w-[200px] truncate"
            @click="copyThreadUrl"
            title="点击复制帖子链接"
          >
            {{ threadUrl }}
          </span>
          <el-button
            class="icon-btn"
            type="primary"
            @click="openInBrowser"
            title="在浏览器中打开"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </el-button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button class="icon-btn" @click="refreshData" :loading="loading && !postData" title="刷新">
          <svg v-if="!loading || postData" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="thread-content flex-1 overflow-auto" ref="contentRef">
      <!-- 加载中（首次） -->
      <div v-if="loading && !postData" class="flex justify-center py-12">
        <el-icon class="is-loading"><span class="i-carbon-circle-notch text-3xl" /></el-icon>
      </div>

      <!-- 帖子内容 -->
      <div v-else-if="postData" class="post-wrapper">
        <!-- 主帖 -->
        <div class="post-main mb-4">
          <div class="post-header px-5 py-1.5 flex items-center justify-between border-b border-gray-100 bg-white">
            <div class="flex items-center gap-2 flex-1">
              <span class="post-tag text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">楼主</span>
              <h1 class="post-title text-sm font-medium text-gray-700">{{ postData.subject }}</h1>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="postData.authorId"
                class="author text-xs text-gray-400 cursor-pointer hover:text-blue-500 hover:underline"
                @click="goToUserThreads(postData.authorId, postData.author)"
              >
                {{ postData.author }}
              </span>
              <span v-else class="author text-xs text-gray-400">{{ postData.author }}</span>
              <span class="time text-xs text-gray-300">{{ formatTime(postData.postDate) }}</span>
            </div>
          </div>
          <div class="post-content px-5 pt-1.5 pb-2 text-sm text-gray-800" v-html="postData.content"></div>
        </div>

        <!-- 回复列表 -->
        <div class="post-replies bg-white">
          <div class="replies-header px-5 py-2 border-b border-gray-100">
            <span class="text-sm font-medium text-gray-600">全部回复</span>
          </div>
          <div v-if="replies.length > 0" class="replies-container">
            <div
              v-for="reply in replies"
              :key="reply.pid"
              class="reply-item bg-white hover:bg-gray-50 transition-colors"
              :class="{ 'hot-reply': reply.isHot }"
            >
              <div class="reply-header px-5 py-1 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <!-- 热门标签 -->
                  <div v-if="reply.isHot" class="hot-badge text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                    热门
                  </div>
                  <!-- 楼层号 - 弱化 -->
                  <span class="floor-num text-xs text-gray-300">#{{ reply.floor }}</span>
                  <!-- 用户名 -->
                  <span
                    v-if="reply.authorId"
                    class="author text-xs text-gray-400 cursor-pointer hover:text-blue-500 hover:underline"
                    @click="goToUserThreads(reply.authorId, reply.author)"
                  >
                    {{ reply.author }}
                  </span>
                  <span v-else class="author text-xs text-gray-400">{{ reply.author }}</span>
                </div>
                <!-- 时间 -->
                <span class="time text-xs text-gray-300">{{ formatTime(reply.postDate) }}</span>
              </div>
              <div class="reply-content px-5 pt-1 pb-2 text-sm text-gray-800" v-html="reply.content"></div>
            </div>

            <!-- 加载更多 -->
            <div v-if="loadingMore" class="flex justify-center py-4">
              <el-icon class="is-loading"><span class="i-carbon-circle-notch text-xl" /></el-icon>
            </div>

            <!-- 没有更多了 -->
            <div v-else-if="!hasMore" class="text-center py-4 text-gray-400 text-sm">
              没有更多回复了
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-400">
            暂无回复
          </div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else class="flex flex-col items-center justify-center py-12">
        <span class="i-carbon-warning-alt text-5xl text-gray-300 mb-4" />
        <p class="text-gray-500 mb-2">加载失败</p>
        <el-button size="small" @click="loadPostDetail">重试</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'
import { ngaApiRequest } from '@/api/nga'
import { ElMessage } from 'element-plus'
import { parseNgaContent } from '@/utils/emoticon'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const currentFloor = ref(1) // 当前楼层数

// 记录已加载的 pid，防止重复
const loadedPids = ref<Set<number>>(new Set())

// 内容区引用，用于滚动监听
const contentRef = ref<HTMLElement | null>(null)

// 帖子数据
interface PostData {
  subject: string
  author: string
  authorId?: number
  content: string
  postDate: number
}

interface Reply {
  pid: number
  floor: number // 楼层号
  author: string
  authorId?: number
  content: string
  postDate: number
  isHot?: boolean
}

const postData = ref<PostData | null>(null)
const replies = ref<Reply[]>([])
const copySuccess = ref(false)

// 帖子链接
const threadUrl = computed(() => `https://bbs.nga.cn/read.php?tid=${tid.value}`)

// 获取 tid 参数
const tid = ref<number>(0)

// 格式化时间 - 显示详细时间
const formatTime = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)

  // 格式化为：YYYY-MM-DD HH:mm
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 加载帖子详情
const loadPostDetail = async (isFirstPage: boolean = true) => {
  if (!tid.value) return

  // 如果是加载更多，使用 loadingMore，否则使用 loading
  if (isFirstPage) {
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const response = await ngaApiRequest.getPostDetail({
      tid: tid.value.toString(),
      page: currentPage.value.toString(),
    })

    if (response.success && response.body) {
      await parsePostContent(response.body, isFirstPage)
    } else {
      ElMessage.error('获取帖子详情失败')
    }
  } catch (error: any) {
    console.error('获取帖子详情失败:', error)
    ElMessage.error('获取帖子详情失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 解析帖子内容
const parsePostContent = async (body: string, isFirstPage: boolean) => {
  try {
    // 先尝试从HTML中提取用户名映射
    // NGA论坛通常在JavaScript中定义了用户信息
    const userMap = new Map<number, string>()

    // 尝试匹配 __UID_64691174 = '用户名' 这样的模式
    const uidPattern = /__UID_(\d+)\s*=\s*['"]([^'"]+)['"]/g
    let match
    while ((match = uidPattern.exec(body)) !== null) {
      const uid = parseInt(match[1])
      const username = match[2]
      userMap.set(uid, username)
    }

    // 尝试匹配其他可能的用户名格式
    const unamePattern = /__UNAME_(\d+)\s*=\s*['"]([^'"]+)['"]/g
    while ((match = unamePattern.exec(body)) !== null) {
      const uid = parseInt(match[1])
      const username = match[2]
      userMap.set(uid, username)
    }

    // 尝试从 script 标签中提取用户信息
    const scriptPattern = /uid['"]\s*:\s*(\d+)[^}]*username['"]\s*:\s*['"]([^'"]+)['"]/gi
    while ((match = scriptPattern.exec(body)) !== null) {
      const uid = parseInt(match[1])
      const username = match[2]
      userMap.set(uid, username)
    }

    // 定义辅助函数：从用户链接元素中提取用户名和用户ID
    const extractUserInfo = (userLink: Element | null): { username: string; authorId?: number } => {
      if (!userLink) {
        return { username: '用户' }
      }

      // 提取用户ID
      const href = userLink.getAttribute('href') || ''
      const uidMatch = href.match(/uid=(\d+)/)
      const authorId = uidMatch ? parseInt(uidMatch[1]) : undefined

      // 方法1：获取完整的textContent，然后去除第一个字符（<b>标签的内容）
      // HTML结构: <a><b>x</b>用户名</a>
      const fullText = userLink.textContent?.trim() || ''
      if (fullText.length > 1) {
        // 去掉首字母（来自<b>标签）
        return { username: fullText.substring(1), authorId }
      }

      // 方法2：获取所有子节点，找到文本节点
      let username = ''
      userLink.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim() || ''
          if (text && text.length > 0) {
            username = text
          }
        }
      })
      if (username) {
        return { username, authorId }
      }

      // 方法3：从用户映射中获取
      if (uidMatch && userMap.has(parseInt(uidMatch[1]))) {
        return { username: userMap.get(parseInt(uidMatch[1])) || '用户', authorId }
      }

      // 方法4：最后使用UID
      if (uidMatch) {
        return { username: `用户${uidMatch[1]}`, authorId }
      }

      return { username: '用户', authorId }
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(body, 'text/html')

    // 提取 __NOW 时间戳（服务器当前时间）
    const nowMatch = body.match(/__NOW\s*=\s*(\d+)/)
    const serverNow = nowMatch ? parseInt(nowMatch[1]) : Math.floor(Date.now() / 1000)

    // 查找主帖 - id 匹配 postcontentandsubject\d+
    const mainPostPattern = /^postcontentandsubject\d+$/
    const mainPostElements = Array.from(doc.querySelectorAll('[id]')).filter(el =>
      mainPostPattern.test(el.id)
    )

    // 查找热门回复 - id 匹配 postcommentcontentandsubject\d+
    const hotReplyPattern = /^postcommentcontentandsubject\d+$/
    const hotReplyElements = Array.from(doc.querySelectorAll('[id]')).filter(el =>
      hotReplyPattern.test(el.id)
    )

    if (mainPostElements.length > 0) {
      // 如果是第一页，解析主帖
      if (isFirstPage) {
        // 第一个是主帖
        const mainPost = mainPostElements[0]

        // 提取标题 - 可能在 h3 中
        const h3Element = mainPost.querySelector('h3')
        const subject = h3Element?.textContent?.trim() || ''

        // 提取内容
        const contentElement = mainPost.querySelector('.postcontent')
        const rawContent = contentElement?.innerHTML || ''
        const content = await parseNgaContent(rawContent)

        // 查找时间和用户信息
        let postDate = serverNow
        let author = '用户'

        const postDateElement = doc.getElementById('postdate0')
        if (postDateElement) {
          const dateText = postDateElement.textContent?.trim() || ''
          const dateMatch = dateText.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/)
          if (dateMatch) {
            const [, year, month, day, hour, minute] = dateMatch
            postDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)).getTime() / 1000
          }
        }

        // 获取用户信息
        const userLink = doc.getElementById('postauthor0')
        const userInfo = extractUserInfo(userLink)
        author = userInfo.username

        postData.value = {
          subject,
          author,
          authorId: userInfo.authorId,
          content,
          postDate,
        }

        currentFloor.value = 1
      }

      // 解析回复
      const repliesList: Reply[] = []
      const startIndex = isFirstPage ? 1 : 0 // 第一页跳过主帖
      let hasDuplicate = false

      // 先收集所有需要转换的原始内容
      const rawReplies: Array<{
        element: Element
        index: number
        pid: number
        author: string
        authorId?: number
        time: number
      }> = []

      for (let i = startIndex; i < mainPostElements.length; i++) {
        const replyElement = mainPostElements[i]

        // 从 pid 锚点提取真正的 pid
        // 格式: <a id="pid859389372Anchor"></a>
        let pid = 0
        const pidAnchor = replyElement.parentElement?.querySelector('a[id^="pid"]')
        if (pidAnchor) {
          const pidMatch = pidAnchor.id.match(/pid(\d+)Anchor/)
          if (pidMatch) {
            pid = parseInt(pidMatch[1])
          }
        }

        // 如果找不到 pid 锚点，使用索引作为备用方案
        if (pid === 0) {
          pid = parseInt(replyElement.id.replace('postcontentandsubject', '')) || 0
        }

        // 检查是否重复
        if (pid > 0 && loadedPids.value.has(pid)) {
          hasDuplicate = true
          break
        }

        // 提取作者和时间
        let replyAuthor = '用户'
        let replyTime = serverNow

        // 智能查找对应的作者链接
        // 不要依赖索引，直接从 replyElement 的 DOM 结构中查找
        const actualIndex = isFirstPage ? i : i
        let userLink: HTMLElement | null = null

        // 方法1：从 replyElement 中提取 pid，查找对应的 posterinfo
        const replyPid = replyElement.id.replace('postcontentandsubject', '')

        // 查找同级元素中的 posterinfo（NGA HTML 结构中，posterinfo 和 postcontentandsubject 通常在同一级）
        const parentElement = replyElement.parentElement
        if (parentElement) {
          // 查找同级中的 posterinfo
          const siblingPosterInfo = Array.from(parentElement.children).find(el =>
            el.classList.contains('posterinfo') || el.id === `posterinfo${replyPid}`
          )
          if (siblingPosterInfo) {
            userLink = siblingPosterInfo.querySelector('a[id^="postauthor"]') as any
          }
        }

        // 方法2：如果找不到，尝试在父级的父级中查找
        if (!userLink && parentElement?.parentElement) {
          const grandParent = parentElement.parentElement
          const posterInfo = grandParent.querySelector('.posterinfo') as any
          if (posterInfo) {
            userLink = posterInfo.querySelector('a[id^="postauthor"]')
          }
        }

        // 方法3：如果还是找不到，尝试使用索引（作为最后的备用方案）
        if (!userLink) {
          userLink = doc.getElementById(`postauthor${actualIndex}`)
        }

        const userInfo = extractUserInfo(userLink)
        replyAuthor = userInfo.username

        // 从文档中查找对应的时间元素
        // 注意：第二页时，元素的ID可能不是从0开始
        // 需要找到对应的时间元素，它可能在 replyElement 内部或附近
        const postDateId = `postdate${actualIndex}`
        const postDateElement = doc.getElementById(postDateId)
        if (postDateElement) {
          const dateText = postDateElement.textContent?.trim() || ''
          const dateMatch = dateText.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/)
          if (dateMatch) {
            const [, year, month, day, hour, minute] = dateMatch
            replyTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)).getTime() / 1000
          }
        } else {
          // 如果找不到对应的时间元素，尝试在 replyElement 内部查找
          const innerDateElement = replyElement.querySelector('[id^="postdate"]')
          if (innerDateElement) {
            const dateText = innerDateElement.textContent?.trim() || ''
            const dateMatch = dateText.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/)
            if (dateMatch) {
              const [, year, month, day, hour, minute] = dateMatch
              replyTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)).getTime() / 1000
            }
          }
        }

        rawReplies.push({
          element: replyElement,
          index: i,
          pid,
          author: replyAuthor,
          authorId: userInfo.authorId,
          time: replyTime,
        })

        // 记录 pid
        if (pid > 0) {
          loadedPids.value.add(pid)
        }
      }

      // 批量转换表情
      const contentPromises = rawReplies.map(async (raw) => {
        const replyContentElement = raw.element.querySelector('.postcontent')
        const rawContent = replyContentElement?.innerHTML || ''
        return await parseNgaContent(rawContent)
      })

      const convertedContents = await Promise.all(contentPromises)

      // 计算起始楼层号
      const startFloor = isFirstPage ? 1 : replies.value.length + 1

      // 构建回复列表
      for (let i = 0; i < rawReplies.length; i++) {
        const raw = rawReplies[i]
        repliesList.push({
          pid: raw.pid,
          floor: startFloor + repliesList.length,
          author: raw.author,
          authorId: raw.authorId,
          content: convertedContents[i],
          postDate: raw.time,
        })
      }

      // 如果发现重复，不再继续加载热门回复
      if (!hasDuplicate) {
        // 收集热门回复
        const rawHotReplies: Array<{
          element: Element
          pid: number
          author: string
          authorId?: number
        }> = []

        for (const hotReply of hotReplyElements) {
          // 提取 pid
          const hotPid = parseInt(hotReply.id.replace('postcommentcontentandsubject', '')) || 0

          // 检查是否重复
          if (hotPid > 0 && loadedPids.value.has(hotPid)) {
            continue
          }

          // 获取用户信息
          const userLink = hotReply.querySelector('a[href*="uid="]')
          const userInfo = extractUserInfo(userLink)

          rawHotReplies.push({
            element: hotReply,
            pid: hotPid,
            author: userInfo.username,
            authorId: userInfo.authorId,
          })

          // 记录 pid
          if (hotPid > 0) {
            loadedPids.value.add(hotPid)
          }
        }

        // 批量转换热门回复表情
        const hotContentPromises = rawHotReplies.map(async (raw) => {
          const hotContentElement = raw.element.querySelector('.postcontent')
          const rawContent = hotContentElement?.innerHTML || ''
          return await parseNgaContent(rawContent)
        })

        const hotConvertedContents = await Promise.all(hotContentPromises)

        // 添加热门回复（楼层号继续累加）
        for (let i = 0; i < rawHotReplies.length; i++) {
          const raw = rawHotReplies[i]
          repliesList.push({
            pid: raw.pid,
            floor: startFloor + repliesList.length,
            author: raw.author,
            authorId: raw.authorId,
            content: hotConvertedContents[i],
            postDate: serverNow,
            isHot: true,
          })
        }
      } else {
        hasMore.value = false
      }

      // 更新回复列表
      if (isFirstPage) {
        replies.value = repliesList
      } else {
        replies.value = [...replies.value, ...repliesList]
      }

      // 更新当前楼层数
      currentFloor.value = replies.value.length + 1

      // 解析是否还有更多
      parseHasMore(doc, isFirstPage, repliesList.length)
    } else {
      if (isFirstPage) {
        ElMessage.warning('未找到帖子内容')
      }
      hasMore.value = false
    }
  } catch (error) {
    console.error('解析帖子内容失败:', error)
    ElMessage.error('解析帖子内容失败')
  }
}

// 解析是否还有更多
const parseHasMore = (doc: Document, isFirstPage: boolean, newReplyCount: number) => {
  // 查找所有分页链接
  const pageElements = doc.querySelectorAll('.page-link, .pages a, a[href*="page="]')
  let maxPage = 1
  const seenPages = new Set<number>()

  for (const pageEl of pageElements) {
    const href = pageEl.getAttribute('href') || ''
    const pageMatch = href.match(/page=(\d+)/)
    if (pageMatch) {
      const page = parseInt(pageMatch[1])
      if (page > 0 && page < 1000) { // 合理的页码范围
        seenPages.add(page)
        if (page > maxPage) {
          maxPage = page
        }
      }
    }

    // 也尝试从文本中提取页码
    const text = pageEl.textContent || ''
    const textMatch = text.match(/^(\d+)$/)
    if (textMatch) {
      const page = parseInt(textMatch[1])
      if (page > 0 && page < 1000) {
        seenPages.add(page)
        if (page > maxPage) {
          maxPage = page
        }
      }
    }
  }

  // 判断是否还有更多
  // 方法1: 如果当前页大于最大页码，说明已经是最后一页了
  if (currentPage.value >= maxPage) {
    hasMore.value = false
    return
  }

  // 方法2: 如果新加载的内容数量明显少于正常值（NGA通常每页20条左右），可能是最后一页
  if (!isFirstPage && newReplyCount < 15) {
    hasMore.value = false
    return
  }

  // 方法3: 检查是否有下一页链接
  const currentPageInSet = seenPages.has(currentPage.value)
  const hasNextPage = seenPages.has(currentPage.value + 1)

  if (hasNextPage) {
    hasMore.value = true
  } else if (currentPageInSet && currentPage.value < maxPage) {
    hasMore.value = true
  } else {
    hasMore.value = false
  }
}

// 加载更多
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value || loading.value) return

  currentPage.value++
  await loadPostDetail(false)
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

// 返回
const goBack = () => {
  router.back()
}

// 跳转到用户帖子列表
const goToUserThreads = (authorId: number, username: string) => {
  router.push({
    name: 'UserThreads',
    params: { authorId: authorId.toString() },
    query: { username }
  })
}

// 刷新
const refreshData = () => {
  currentPage.value = 1
  hasMore.value = true
  replies.value = []
  loadedPids.value.clear()
  currentFloor.value = 1
  loadPostDetail(true)
}

// 复制帖子链接
const copyThreadUrl = () => {
  const url = threadUrl.value
  navigator.clipboard.writeText(url).then(() => {
    copySuccess.value = true
    ElMessage.success('链接已复制到剪贴板')
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  }).catch(() => {
    // 降级方案：使用传统方法
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      copySuccess.value = true
      ElMessage.success('链接已复制到剪贴板')
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    } catch (err) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textarea)
  })
}

// 在浏览器中打开
const openInBrowser = async () => {
  try {
    await invoke('open_url', { url: threadUrl.value })
    ElMessage.success('已在浏览器中打开')
  } catch (error) {
    console.error('打开浏览器失败:', error)
    ElMessage.error('打开浏览器失败: ' + (error as string))
  }
}

// 监听路由参数变化
watch(
  () => route.params.tid,
  (newTid) => {
    if (newTid) {
      tid.value = Number(newTid)
      currentPage.value = 1
      hasMore.value = true
      replies.value = []
      postData.value = null
      currentFloor.value = 1
      loadedPids.value.clear()

      nextTick(() => {
        loadPostDetail(true)
      })
    }
  },
  { immediate: true }
)

onMounted(() => {
  // 添加滚动监听
  if (contentRef.value) {
    contentRef.value.addEventListener('scroll', handleScroll)
  }

  // 添加回复链接点击事件委托
  const handleReplyLinkClick = (e: Event) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('nga-reply-link')) {
      e.preventDefault()
      const pid = target.getAttribute('data-pid')
      if (pid) {
        jumpToReply(parseInt(pid))
      }
    }
  }
  document.addEventListener('click', handleReplyLinkClick)

  // 保存引用以便清理
  ;(window as any).__replyLinkClickHandler = handleReplyLinkClick
})

// 跳转到指定回复
const jumpToReply = (pid: number) => {
  // 在当前回复列表中查找
  const replyIndex = replies.value.findIndex(r => r.pid === pid)

  if (replyIndex !== -1) {
    // 找到了，滚动到该位置
    nextTick(() => {
      const replyElements = document.querySelectorAll('.reply-item')
      const targetElement = replyElements[replyIndex] as HTMLElement
      if (targetElement && contentRef.value) {
        // 高亮显示
        targetElement.style.background = '#fff9c4'
        setTimeout(() => {
          targetElement.style.background = ''
        }, 2000)

        // 滚动到该位置
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  } else {
    // 没找到，可能需要加载更多页面
    ElMessage.warning('该回复不在当前页面，暂未实现跨页跳转')
  }
}

onUnmounted(() => {
  // 移除滚动监听
  if (contentRef.value) {
    contentRef.value.removeEventListener('scroll', handleScroll)
  }

  // 移除回复链接点击事件
  const handler = (window as any).__replyLinkClickHandler
  if (handler) {
    document.removeEventListener('click', handler)
    delete (window as any).__replyLinkClickHandler
  }
})
</script>

<style scoped>
.thread-container {
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

.icon-btn[type="primary"] {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.icon-btn[type="primary"]:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.icon-btn[type="primary"]:active {
  background: #1d4ed8;
}

.icon-btn[type="primary"] .btn-icon {
  stroke: white;
}

.btn-icon {
  width: 16px;
  height: 16px;
  stroke: #475569;
}

.post-wrapper {
  padding-bottom: 20px;
}

/* 主帖样式 */
.post-main {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.post-title {
  flex: 1;
  line-height: 1.4;
  font-size: 16px;
}

.post-tag {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.floor-num {
  font-weight: normal;
  color: #9ca3af;
}

.post-content {
  line-height: 1.7;
  word-wrap: break-word;
}

.post-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.post-content :deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

.post-content :deep(a:hover) {
  color: #2563eb;
  text-decoration: underline;
}

/* 回复列表样式 */
.replies-container {
  background: white;
}

.replies-header {
  background: white;
}

/* 回复项样式 */
.reply-item {
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.15s ease;
}

.reply-item:hover {
  background-color: #fafafa;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-item.hot-reply {
  border-left: 3px solid #f97316;
  background-color: #fffbf7;
}

.reply-item.hot-reply:hover {
  background-color: #fff5eb;
}

.floor-num {
  font-weight: normal;
}

.author {
  color: #9ca3af;
}

.time {
  color: #d1d5db;
}

.reply-content {
  line-height: 1.7;
  word-wrap: break-word;
}

.reply-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.reply-content :deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

.reply-content :deep(a:hover) {
  color: #2563eb;
  text-decoration: underline;
}

.reply-content :deep(.nga-quote-block) {
  margin: 6px 0;
}

.reply-content :deep(.nga-inline-quote) {
  margin: 4px 0;
}

.reply-content :deep(s) {
  text-decoration: line-through;
  color: #9ca3af;
}
</style>
