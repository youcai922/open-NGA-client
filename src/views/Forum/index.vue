<template>
  <div class="forum-container h-full flex flex-col">
    <!-- 顶部导航 -->
    <div class="forum-header h-12 flex items-center justify-between px-4 bg-gray-100 border-b">
      <h2 class="text-lg font-semibold">论坛</h2>
    </div>

    <!-- 主内容区 -->
    <div class="forum-content flex-1 flex overflow-hidden">
      <!-- 左侧板块列表 -->
      <div class="forum-sidebar w-56 border-r overflow-auto bg-gray-50 flex flex-col">
        <!-- 空状态 -->
        <div v-if="forumStore.isEmpty && !loading" class="empty-state p-4 text-center flex-1">
          <p class="text-gray-500 text-sm mb-4">暂无收藏板块</p>
          <el-button type="primary" size="small" @click="initFromFavorites">
            从收藏初始化
          </el-button>
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

        <!-- 底部添加按钮 -->
        <div class="sidebar-footer p-3 border-t">
          <el-button size="small" class="w-full" @click="showAddDialog = true">
            <template #icon>
              <span class="i-carbon-add" />
            </template>
            添加板块
          </el-button>
        </div>
      </div>

      <!-- 右侧主题列表 -->
      <div class="forum-main flex-1 overflow-auto">
        <!-- 未选中板块 -->
        <div v-if="!forumStore.currentForum" class="empty-forum flex items-center justify-center h-full">
          <div class="text-center text-gray-400">
            <span class="i-carbon-forum text-6xl mb-4 block" />
            <p>请选择一个板块查看主题</p>
          </div>
        </div>

        <!-- 主题列表 -->
        <div v-else class="thread-list p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold">{{ forumStore.currentForum.name }}</h3>
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="20"
              :total="totalThreads"
              layout="prev, pager, next"
              small
              @current-change="loadThreads"
            />
          </div>

          <!-- 加载中 -->
          <div v-if="loadingThreads" class="flex justify-center py-8">
            <el-icon class="is-loading"><span class="i-carbon-circle-notch text-2xl" /></el-icon>
          </div>

          <!-- 主题列表 -->
          <div v-else-if="threads.length > 0" class="thread-items">
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
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-8 text-gray-400">
            <p>暂无主题</p>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useForumStore } from '@/stores/forum'
import { ngaApiRequest } from '@/api/nga'
import { ElMessage, ElMessageBox } from 'element-plus'
import AddForumDialog from './AddForumDialog.vue'

const router = useRouter()
const forumStore = useForumStore()

const showAddDialog = ref(false)
const loading = ref(false)
const loadingThreads = ref(false)
const currentPage = ref(1)
const totalThreads = ref(0)

interface Thread {
  tid: number
  subject: string
  author: string
  replies: number
  last_post: number
}

const threads = ref<Thread[]>([])

// 从收藏初始化
const initFromFavorites = async () => {
  loading.value = true
  try {
    const response = await ngaApiRequest.getFavoriteForums()
    if (response.success && response.body) {
      // NGA 返回的是 HTML，包含 script_muti_get_var_store 变量
      let data: any = null

      // 尝试解析 script_muti_get_var_store
      const match = response.body.match(/window\.script_muti_get_var_store\s*=\s*(\{[^}]+\})/)
      if (match) {
        try {
          data = JSON.parse(match[1])
        } catch {
          // 解析失败，尝试其他方式
        }
      }

      // 如果上面没找到，尝试直接解析 JSON
      if (!data) {
        try {
          data = JSON.parse(response.body)
        } catch {
          // 忽略解析错误
        }
      }

      console.log('解析后的数据:', data)

      // 检查数据格式
      if (data && data.data) {
        // NGA 返回格式可能是 {data: {"0": ""}} 表示空
        // 或者 {data: [{"fid": 1, "name": "xxx"}]}
        const forumsData = data.data

        // 检查是否是空数据 {"0": ""}
        if (typeof forumsData === 'object' && Object.keys(forumsData).length === 1 && forumsData['0'] === '') {
          ElMessage.warning('收藏板块为空，请手动添加板块')
          showAddDialog.value = true
        } else if (Array.isArray(forumsData) && forumsData.length > 0) {
          // 正常的数组数据
          let addedCount = 0
          for (const item of forumsData) {
            const success = await forumStore.addForum({
              fid: item.fid || item.id,
              name: item.name || item.title || item.sticker || '',
              description: item.description || '',
            })
            if (success) addedCount++
          }
          ElMessage.success(`已导入 ${addedCount} 个收藏板块`)
        } else {
          ElMessage.warning('未找到收藏板块数据，请手动添加')
          showAddDialog.value = true
        }
      } else {
        ElMessage.warning('返回数据格式异常，请手动添加板块')
        showAddDialog.value = true
      }
    } else {
      ElMessage.error('获取收藏板块失败')
    }
  } catch (error: any) {
    console.error('获取收藏板块失败:', error)
    ElMessage.error('获取收藏板块失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 选择板块
const selectForum = (forum: any) => {
  forumStore.setCurrentForum(forum)
  currentPage.value = 1
  loadThreads()
}

// 加载主题列表
const loadThreads = async () => {
  if (!forumStore.currentForum) return

  loadingThreads.value = true
  try {
    const response = await ngaApiRequest.getThreadList({
      fid: forumStore.currentForum.fid.toString(),
      page: currentPage.value.toString(),
    })

    if (response.success && response.body) {
      // 解析主题列表 - NGA 返回的是 JavaScript 代码格式
      const data = parseThreadList(response.body)
      threads.value = data.threads
      totalThreads.value = data.total
    } else {
      ElMessage.error('获取主题列表失败')
    }
  } catch (error: any) {
    console.error('获取主题列表失败:', error)
    ElMessage.error('获取主题列表失败')
  } finally {
    loadingThreads.value = false
  }
}

// 解析主题列表数据
const parseThreadList = (body: string): { threads: Thread[], total: number } => {
  const threads: Thread[] = []

  // NGA 返回的是包含 JavaScript 变量的 HTML
  // 提取 __THREAD_DATA 或类似变量
  try {
    // 尝试匹配主题数组
    const threadDataMatch = body.match(/__THREAD_DATA\s*=\s*(\[[\s\S]*?\]);/)

    if (threadDataMatch) {
      const threadArray = JSON.parse(threadDataMatch[1])
      for (const item of threadArray) {
        threads.push({
          tid: item.tid || item.id || 0,
          subject: item.subject || item.title || '',
          author: item.author || item.username || '',
          replies: item.replies || 0,
          last_post: item.last_post || 0,
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
  router.push({ name: 'Thread', params: { tid } })
}

// 板块添加后的回调
const onForumAdded = () => {
  ElMessage.success('添加成功')
}

// 组件挂载时加载配置并选择第一个板块
onMounted(async () => {
  await forumStore.loadFromConfig()
  if (!forumStore.isEmpty && forumStore.myForums.length > 0) {
    // 如果有当前选中的板块，使用它；否则使用第一个
    const forumToSelect = forumStore.currentForum || forumStore.myForums[0]
    await selectForum(forumToSelect)
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

.thread-item:hover {
  border-color: #3b82f6;
}
</style>
