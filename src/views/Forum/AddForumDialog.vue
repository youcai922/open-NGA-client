<template>
  <el-dialog
    v-model="visible"
    title="添加板块"
    width="600px"
    center
    @close="handleClose"
  >
    <!-- 搜索框 -->
    <el-input
      v-model="searchText"
      placeholder="搜索板块名称..."
      clearable
      class="mb-4"
    >
      <template #prefix>
        <span class="i-carbon-search" />
      </template>
    </el-input>

    <!-- 板块列表 -->
    <div class="forum-list-container max-h-96 overflow-auto border rounded">
      <!-- 加载中 -->
      <div v-if="loading" class="flex justify-center py-8">
        <el-icon class="is-loading"><span class="i-carbon-circle-notch text-2xl" /></el-icon>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredForums.length === 0" class="text-center py-8 text-gray-400">
        <p>{{ searchText ? '未找到匹配的板块' : '暂无可用板块' }}</p>
      </div>

      <!-- 板块列表 -->
      <div v-else class="forum-items">
        <div
          v-for="forum in filteredForums"
          :key="forum.fid"
          class="forum-list-item px-4 py-3 border-b flex items-center justify-between"
        >
          <div class="flex-1 min-w-0">
            <div class="forum-name text-sm font-medium truncate">{{ forum.name }}</div>
            <div v-if="forum.description" class="forum-desc text-xs text-gray-500 truncate">
              {{ forum.description }}
            </div>
          </div>
          <el-button
            :icon="isAdded(forum.fid) ? 'i-carbon-star-filled' : 'i-carbon-star'"
            :type="isAdded(forum.fid) ? 'warning' : 'default'"
            size="small"
            text
            @click="toggleFavorite(forum.fid)"
          >
            {{ isAdded(forum.fid) ? '已收藏' : '收藏' }}
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useForumStore } from '@/stores/forum'
import { ngaApiRequest } from '@/api/nga'
import { ElMessage } from 'element-plus'
import type { NgaForum } from '@/config/env'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'added'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const forumStore = useForumStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const searchText = ref('')
const loading = ref(false)

// 过滤后的板块列表
const filteredForums = computed(() => {
  if (!searchText.value) {
    return forumStore.allForums
  }
  const search = searchText.value.toLowerCase()
  return forumStore.allForums.filter(forum =>
    forum.name.toLowerCase().includes(search) ||
    (forum.description && forum.description.toLowerCase().includes(search))
  )
})

// 是否已添加
const isAdded = (fid: number) => {
  return forumStore.myForums.some(f => f.fid === fid)
}

// 加载所有板块
const loadAllForums = async () => {
  // 如果已有数据，不再重复加载
  if (forumStore.allForums.length > 0) {
    return
  }

  loading.value = true
  try {
    const response = await ngaApiRequest.getForumList()

    if (response.success && response.data && response.data.length > 0) {
      // 直接使用后端解析好的板块列表
      const forums: NgaForum[] = response.data.map((item: any) => ({
        fid: item.fid,
        name: item.name,
        description: item.info || item.info_s || '',
      }))
      forumStore.setAllForums(forums)
    } else {
      ElMessage.error('获取板块列表失败')
    }
  } catch (error: any) {
    console.error('获取板块列表失败:', error)
    ElMessage.error('获取板块列表失败')
  } finally {
    loading.value = false
  }
}

// 切换收藏状态
const toggleFavorite = async (fid: number) => {
  const forum = forumStore.allForums.find(f => f.fid === fid)
  if (!forum) return

  if (isAdded(fid)) {
    // 取消收藏
    const success = await forumStore.removeForum(fid)
    if (success) {
      ElMessage.success(`已取消收藏：${forum.name}`)
    }
  } else {
    // 添加收藏
    const success = await forumStore.addForum(forum)
    if (success) {
      ElMessage.success(`已收藏：${forum.name}`)
    }
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  searchText.value = ''
}

// 监听对话框打开，加载板块列表
watch(() => props.modelValue, async (val) => {
  if (val) {
    await loadAllForums()
  }
})
</script>

<style scoped>
.forum-list-container {
  background: #f9fafb;
}

.forum-list-item:last-child {
  border-bottom: none;
}
</style>
