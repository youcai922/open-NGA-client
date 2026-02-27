<template>
  <div class="cookie-container h-full flex flex-col">
    <div class="cookie-header h-12 flex-center bg-gray-100 border-b">
      <h2 class="text-lg font-semibold">Cookie 设置</h2>
    </div>
    <div class="cookie-content flex-1 overflow-auto p-6">
      <el-alert
        title="如何获取 Cookie"
        type="info"
        :closable="false"
        class="mb-6"
      >
        <template #default>
          <ol class="list-decimal list-inside space-y-2 text-sm">
            <li>在浏览器中登录 NGA 论坛</li>
            <li>按 F12 打开开发者工具</li>
            <li>切换到 Application / 存储 标签</li>
            <li>左侧找到 Cookies -> bbs.nga.cn</li>
            <li>复制需要的 Cookie 值</li>
          </ol>
        </template>
      </el-alert>

      <el-form :model="form" label-width="100px" class="max-w-2xl">
        <el-form-item label="Cookie">
          <el-input
            v-model="form.cookie"
            type="textarea"
            :rows="8"
            placeholder="粘贴你的 NGA Cookie..."
          />
        </el-form-item>

        <el-form-item>
          <el-space>
            <el-button type="primary" @click="saveCookie">保存 Cookie</el-button>
            <el-button @click="clearCookie">清除 Cookie</el-button>
            <el-button @click="testCookie">测试连接</el-button>
          </el-space>
        </el-form-item>

        <el-form-item>
          <el-space>
            <el-tag :type="cookieStore.getStatusType() as any" size="large">
              {{ cookieStore.getStatusText() }}
            </el-tag>
          </el-space>
        </el-form-item>
      </el-form>

      <el-divider />

      <div v-if="testResult" class="test-result">
        <h3 class="text-sm font-semibold mb-2">测试结果：</h3>
        <pre class="text-xs bg-gray-100 p-4 rounded overflow-auto">{{ testResult }}</pre>
      </div>

      <div v-if="requestLogs.length > 0" class="request-logs mt-4">
        <h3 class="text-sm font-semibold mb-2">请求日志：</h3>
        <div class="log-container text-xs bg-gray-900 text-green-400 p-4 rounded overflow-auto">
          <div v-for="(log, index) in requestLogs" :key="index" class="log-entry mb-2">
            <pre>{{ log }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useCookieStore } from '@/stores/cookie'
import { ngaApiRequest, clearCookieCache } from '@/api/nga'
import { ElMessage } from 'element-plus'

const cookieStore = useCookieStore()
const testResult = ref('')
const requestLogs = ref<string[]>([])

// 添加日志
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  requestLogs.value.push(`[${timestamp}] ${message}`)
}

const form = reactive({
  cookie: '',
})

// 初始化时加载 Cookie
onMounted(async () => {
  await cookieStore.init()
  form.cookie = cookieStore.cookie
})

const saveCookie = async () => {
  if (!form.cookie.trim()) {
    ElMessage.warning('请输入 Cookie')
    return
  }
  try {
    await cookieStore.setCookie(form.cookie)
    clearCookieCache() // 清除 nga.ts 中的缓存
    addLog(`Cookie 已保存到配置文件，长度: ${form.cookie.length}`)
    ElMessage.success('Cookie 已保存')
  } catch (error: any) {
    ElMessage.error('保存 Cookie 失败: ' + (error.message || '未知错误'))
  }
}

const clearCookie = async () => {
  try {
    await cookieStore.clearCookie()
    clearCookieCache() // 清除 nga.ts 中的缓存
    form.cookie = ''
    testResult.value = ''
    requestLogs.value = []
    addLog('Cookie 已从配置文件清除')
    ElMessage.success('Cookie 已清除')
  } catch (error: any) {
    ElMessage.error('清除 Cookie 失败: ' + (error.message || '未知错误'))
  }
}

const testCookie = async () => {
  if (!cookieStore.hasCookie()) {
    ElMessage.warning('请先设置 Cookie')
    return
  }

  requestLogs.value = []
  addLog('===== 开始测试 Cookie 连接 =====')
  addLog(`Cookie 状态: ${cookieStore.hasCookie() ? '已设置' : '未设置'}`)
  addLog(`Cookie 长度: ${cookieStore.cookie.length}`)

  try {
    testResult.value = '正在测试连接...'

    addLog('发送请求到: https://bbs.nga.cn/thread.php')
    addLog('参数: fid=-7955747, page=1')

    const response = await ngaApiRequest.getThreadList({
      fid: '-7955747',
      page: '1',
    })

    addLog(`响应状态: ${response.status}`)
    addLog(`响应成功: ${response.success}`)

    if (response.error) {
      addLog(`错误信息: ${response.error}`)
    }

    if (response.body) {
      addLog(`响应数据长度: ${response.body.length}`)
      addLog(`响应数据预览: ${response.body.substring(0, 100)}...`)
    }

    // 成功时显示详细信息
    const result: any = {
      success: response.success,
      status: response.status,
      error: response.error,
      dataLength: response.body?.length || 0,
      dataPreview: response.body?.substring(0, 500) || '',
    }

    testResult.value = JSON.stringify(result, null, 2)

    if (response.success) {
      cookieStore.setConnectionStatus('connected')
      addLog('✓ 连接测试成功')
      ElMessage.success('连接测试成功')
    } else {
      cookieStore.setConnectionStatus('set')
      addLog('✗ 连接测试失败')
      ElMessage.error('连接测试失败')
    }
  } catch (error: any) {
    cookieStore.setConnectionStatus('set')
    addLog(`✗ 请求失败: ${error.message || error}`)
    addLog(`错误详情: ${JSON.stringify(error)}`)

    testResult.value = JSON.stringify({
      success: false,
      error: error.message || error,
      details: error,
    }, null, 2)

    addLog('===== 测试结束 (失败) =====')
    ElMessage.error('连接测试失败')
  }
}
</script>

<style scoped>
.cookie-container {
  background: #f5f5f5;
}

.test-result pre {
  max-height: 300px;
}

.request-logs .log-container {
  max-height: 400px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.log-entry {
  border-bottom: 1px solid #374151;
  padding-bottom: 8px;
}

.log-entry:last-child {
  border-bottom: none;
}
</style>
