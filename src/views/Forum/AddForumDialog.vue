<template>
  <el-dialog
    v-model="visible"
    title="添加板块"
    width="600px"
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
          class="forum-list-item px-4 py-3 border-b cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between"
          :class="{ 'opacity-50': isAdded(forum.fid) }"
          @click="toggleForum(forum)"
        >
          <div class="flex-1">
            <div class="forum-name text-sm font-medium">{{ forum.name }}</div>
            <div v-if="forum.description" class="forum-desc text-xs text-gray-500 truncate">
              {{ forum.description }}
            </div>
          </div>
          <el-checkbox
            :model-value="selectedForums.has(forum.fid) || isAdded(forum.fid)"
            :disabled="isAdded(forum.fid)"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
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
const selectedForums = ref<Set<number>>(new Set())

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
    console.log('开始获取板块列表...')
    const response = await ngaApiRequest.getForumList()
    console.log('bbs_index_data.js 响应:', response.success, 'status:', response.status, 'body length:', response.body?.length)

    if (response.success && response.body) {
      // 解析返回的 JS 文件，提取板块信息
      const forums = parseForumList(response.body)
      forumStore.setAllForums(forums)
      console.log('最终设置的板块列表:', forums.length)
    } else {
      console.error('获取板块列表失败:', response)
      ElMessage.error('获取板块列表失败')
    }
  } catch (error: any) {
    console.error('获取板块列表失败:', error)
    ElMessage.error('获取板块列表失败')
  } finally {
    loading.value = false
  }
}

// 解析板块列表 JS 文件
const parseForumList = (content: string): NgaForum[] => {
  const forums: NgaForum[] = []

  console.log('bbs_index_data.js 返回长度:', content.length)
  console.log('内容预览:', content.substring(0, 500))

  try {
    // 尝试直接解析整个内容为 JSON
    let data: any
    try {
      data = JSON.parse(content)
      console.log('直接解析 JSON 成功')
    } catch (e) {
      // 如果直接解析失败，可能需要提取 __FORUM 变量
      const forumMatch = content.match(/__FORUM\s*=\s*(\{[\s\S]*?\});/)
      if (forumMatch) {
        console.log('找到 __FORUM 变量，尝试解析')
        // 尝试将 JavaScript 对象转为 JSON
        let jsonStr = forumMatch[1]
        // 简单的转换：单引号转双引号
        jsonStr = jsonStr.replace(/'/g, '"')
        data = JSON.parse(jsonStr)
      } else {
        throw e
      }
    }

    // 从 data.data 中提取板块
    if (data && data.data) {
      console.log('找到 data.data，开始解析')
      parseForumObject(data.data, forums)
    } else {
      console.log('直接从根解析')
      parseForumObject(data, forums)
    }
  } catch (error) {
    console.error('解析板块列表失败:', error)
  }

  console.log('最终解析到的板块数量:', forums.length)
  console.log('前20个板块:', forums.slice(0, 20))

  return forums
}

// 递归解析板块数据对象
const parseForumObject = (data: any, forums: NgaForum[]) => {
  if (!data || typeof data !== 'object') return

  for (const key in data) {
    const value = data[key]

    // 如果是数字键（字符串形式的数字索引），跳过并继续处理值
    if (/^\d+$/.test(key)) {
      if (value && typeof value === 'object') {
        parseForumObject(value, forums)
      }
      continue
    }

    // 如果值是对象且包含 fid，说明是板块
    if (value && typeof value === 'object') {
      if (value.fid !== undefined) {
        const fid = parseInt(value.fid)
        const name = value.name || value.sticker
        const info = value.info || value.description || ''

        if (!isNaN(fid) && name && typeof name === 'string') {
          // 避免重复
          if (!forums.some(f => f.fid === fid)) {
            forums.push({
              fid,
              name: name.trim(),
              description: info.trim(),
            })
          }
        }
      } else {
        // 递归处理子对象（可能是分类）
        parseForumObject(value, forums)
      }
    }
  }
}

// 切换板块选择
const toggleForum = (forum: NgaForum) => {
  if (isAdded(forum.fid)) return

  if (selectedForums.value.has(forum.fid)) {
    selectedForums.value.delete(forum.fid)
  } else {
    selectedForums.value.add(forum.fid)
  }
  // 触发响应式更新
  selectedForums.value = new Set(selectedForums.value)
}

// 确认添加
const handleConfirm = () => {
  const forumsToAdd = forumStore.allForums.filter(f => selectedForums.value.has(f.fid))

  if (forumsToAdd.length === 0) {
    ElMessage.warning('请至少选择一个板块')
    return
  }

  let addedCount = 0
  for (const forum of forumsToAdd) {
    if (forumStore.addForum(forum)) {
      addedCount++
    }
  }

  if (addedCount > 0) {
    ElMessage.success(`已添加 ${addedCount} 个板块`)
    emit('added')
  }

  selectedForums.value.clear()
  handleClose()
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  searchText.value = ''
}

// 监听对话框打开，加载板块列表
watch(() => props.modelValue, (val) => {
  if (val) {
    loadAllForums()
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
