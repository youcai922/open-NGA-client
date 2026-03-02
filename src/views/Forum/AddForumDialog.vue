<template>
  <el-dialog
    v-model="visible"
    title="添加板块"
    width="500px"
    center
    @close="handleClose"
  >
    <!-- 搜索框 -->
    <el-input
      v-model="searchText"
      placeholder="搜索板块名称..."
      clearable
      class="search-input"
    >
      <template #prefix>
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </template>
    </el-input>

    <!-- 板块列表 -->
    <div class="forum-list-container overflow-auto border rounded">
      <!-- 加载中 -->
      <div v-if="loading" class="flex justify-center py-8">
        <el-icon class="is-loading text-blue-500"><span class="i-carbon-circle-notch text-2xl" /></el-icon>
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
          class="forum-list-item flex items-center justify-between"
        >
          <div class="flex-1 min-w-0">
            <div class="forum-name text-sm font-medium truncate">{{ forum.name }}</div>
            <div v-if="forum.description" class="forum-desc text-xs text-gray-500 truncate">
              {{ forum.description }}
            </div>
          </div>
          <el-button
            class="fav-btn"
            :class="{ 'is-favorite': isAdded(forum.fid) }"
            @click="toggleFavorite(forum.fid)"
            :key="`fav-${forum.fid}`"
          >
            <svg v-if="isAdded(forum.fid)" class="star-icon star-filled" viewBox="0 0 32 32">
              <path d="M22.5,9.5L17,8.5L15,3.5L13,8.5L7.5,9.5L11.5,13L10.5,18L15,15.5L19.5,18L18.5,13L22.5,9.5Z"></path>
            </svg>
            <svg v-else class="star-icon star-outline" viewBox="0 0 32 32">
              <path d="M22.5,9.5L17,8.5L15,3.5L13,8.5L7.5,9.5L11.5,13L10.5,18L15,15.5L19.5,18L18.5,13L22.5,9.5Z"></path>
            </svg>
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
.search-input {
  margin-bottom: 12px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  border-color: #93c5fd;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.search-icon {
  width: 18px;
  height: 18px;
  color: #9ca3af;
}

.forum-list-container {
  background: #f9fafb;
  max-height: 360px;
}

.forum-list-item {
  padding: 6px 12px;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.forum-name {
  color: #1f2937;
  font-size: 13px;
}

.forum-desc {
  font-size: 12px;
  margin-top: 2px;
}

.forum-list-item:last-child {
  border-bottom: none;
}

.forum-list-item:hover {
  background: #f3f4f6;
}

.forum-name {
  color: #1f2937;
}

.fav-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 0;
  transition: none;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.fav-btn:hover {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.star-icon {
  width: 36px;
  height: 36px;
  display: block;
}

.star-filled {
  fill: #eab308;
}

.star-outline {
  fill: none;
  stroke: #9ca3af;
  stroke-width: 1.5;
}
</style>

<style>
.el-dialog {
  margin-top: 5vh !important;
  margin-bottom: 5vh !important;
}

.el-dialog__body {
  padding: 12px 20px !important;
}

.el-dialog__footer {
  padding: 8px 20px !important;
}
</style>
