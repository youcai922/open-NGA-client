<template>
  <div class="login-container h-full flex flex-col">
    <!-- 固定在顶部的登录状态栏 -->
    <div class="status-bar sticky-top">
      <div class="status-content">
        <div class="status-left">
          <el-button class="home-btn" @click="goToHome">
            <el-icon :size="18"><ArrowLeft /></el-icon>
          </el-button>
          <div class="page-title">
            <span class="i-carbon-user-multiple mr-1.5"></span>
            <span>账号登录</span>
          </div>
        </div>
        <div class="status-right">
          <div class="status-info">
            <span
              class="status-icon"
              :class="{
                'status-success': isLoggedIn,
                'status-warning': cookieStore.hasCookie() && !isLoggedIn,
                'status-error': !cookieStore.hasCookie()
              }"
            >
              <span v-if="isLoggedIn" class="i-carbon-checkmark-filled"></span>
              <span v-else-if="cookieStore.hasCookie()" class="i-carbon-warning-alt"></span>
              <span v-else class="i-carbon-link"></span>
            </span>
            <span class="status-text">{{ statusText }}</span>
          </div>
          <el-space size="small">
            <el-button
              v-if="cookieStore.hasCookie() && !testing"
              size="small"
              @click="testCookie"
            >
              <span class="i-carbon-renew mr-1"></span>
              测试
            </el-button>
            <el-button
              v-if="cookieStore.hasCookie()"
              size="small"
              type="danger"
              @click="clearCookie"
              :loading="testing"
            >
              <span class="i-carbon-logout mr-1"></span>
              退出
            </el-button>
            <el-button
              v-if="isLoggedIn"
              type="primary"
              size="small"
              @click="goToForum"
            >
              <span class="i-carbon-arrow-right mr-1"></span>
              进入论坛
            </el-button>
          </el-space>
        </div>
      </div>
    </div>

    <div class="login-content flex-1 overflow-auto px-4 py-4">
      <!-- 登录方式选择 -->
      <el-card shadow="never" class="login-methods-card">
        <el-tabs v-model="activeLoginMethod" class="login-tabs">
          <!-- 扫码登录 -->
          <el-tab-pane label="扫码登录" name="qrcode">
            <template #label>
              <div class="tab-label">
                <span class="i-carbon-mobile mr-1.5"></span>
                <span>扫码登录</span>
                <el-tag size="small" effect="dark" type="primary">推荐</el-tag>
              </div>
            </template>

            <div class="tab-content">
              <!-- 已登录提示 -->
              <div v-if="isLoggedIn && !showQrCode" class="logged-in-hint">
                <div class="logged-in-icon">
                  <span class="i-carbon-checkmark-filled text-green-500 text-4xl"></span>
                </div>
                <p class="text-gray-600 mt-2 mb-3">您已成功登录</p>
                <el-button type="primary" @click="goToForum">
                  <span class="i-carbon-arrow-right mr-1"></span>
                  进入论坛
                </el-button>
                <el-button text @click="showQrCode = true" class="mt-2">
                  <span class="i-carbon-qrcode mr-1"></span>
                  重新扫码登录
                </el-button>
              </div>

              <!-- 扫码登录内容 -->
              <template v-else>
                <!-- 生成中 -->
                <div v-if="qrCodeState === 'generating'" class="qr-state">
                  <el-icon class="is-loading text-5xl text-blue-500">
                    <Loading />
                  </el-icon>
                  <p class="text-gray-600 mt-4 text-sm">正在生成二维码...</p>
                </div>

                <!-- 扫码中 -->
                <div v-else-if="qrCodeState === 'scanning'" class="qr-scanning">
                  <div class="qr-image-wrapper">
                    <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="扫码登录" />
                    <div v-else class="qr-placeholder">
                      <el-icon class="is-loading text-3xl text-gray-400">
                        <Loading />
                      </el-icon>
                    </div>
                  </div>
                  <div class="qr-info">
                    <h3 class="text-base font-medium text-gray-800 mb-1">NGA 手机客户端扫码</h3>
                    <p class="text-gray-500 text-xs">打开 NGA 论坛 App，扫描上方二维码登录</p>
                    <div class="qr-actions mt-3">
                      <el-button type="primary" @click="refreshQrCode" size="small">
                        <span class="i-carbon-refresh mr-1"></span>
                        刷新二维码
                      </el-button>
                    </div>
                  </div>
                  <div class="qr-status-pill">
                    <el-icon class="is-loading">
                      <Loading />
                    </el-icon>
                    <span class="text-xs">等待扫码...</span>
                  </div>
                </div>

                <!-- 登录成功 -->
                <div v-else-if="qrCodeState === 'success'" class="qr-state">
                  <div class="success-icon">
                    <span class="i-carbon-checkmark-filled"></span>
                  </div>
                  <p class="text-lg font-semibold text-green-600 mt-3">登录成功！</p>
                  <p v-if="qrUserInfo" class="text-gray-600 mt-1 text-sm">{{ qrUserInfo.username }}</p>
                  <div class="success-actions mt-4">
                    <el-button type="primary" @click="goToForum">
                      <span class="i-carbon-arrow-right mr-1"></span>
                      进入论坛
                    </el-button>
                  </div>
                </div>

                <!-- 登录失败 -->
                <div v-else-if="qrCodeState === 'error'" class="qr-state">
                  <div class="error-icon">
                    <span class="i-carbon-error-filled"></span>
                  </div>
                  <p class="text-base font-semibold text-red-600 mt-3">登录失败</p>
                  <p class="text-gray-500 text-sm mt-1">{{ qrError || '请重试' }}</p>
                  <div class="error-actions mt-4">
                    <el-button type="primary" @click="refreshQrCode">
                      <span class="i-carbon-refresh mr-1"></span>
                      重新生成
                    </el-button>
                  </div>
                </div>
              </template>
            </div>
          </el-tab-pane>

          <!-- 手动输入 -->
          <el-tab-pane label="手动输入" name="manual">
            <template #label>
              <div class="tab-label">
                <span class="i-carbon-keyboard mr-1.5"></span>
                <span>手动输入</span>
              </div>
            </template>

            <div class="tab-content">
              <!-- 已设置提示 -->
              <div v-if="cookieStore.hasCookie()" class="cookie-set-hint">
                <div class="cookie-set-icon">
                  <span class="i-carbon-text-link-analysis text-blue-500 text-4xl"></span>
                </div>
                <p class="text-gray-600 mt-2 mb-3">Cookie 已设置</p>
                <div class="cookie-preview text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded break-all font-mono">
                  {{ cookieStore.cookie.slice(0, 60) }}...
                </div>
                <el-space>
                  <el-button type="danger" @click="clearCookie">
                    <span class="i-carbon-trash-can mr-1"></span>
                    清除 Cookie
                  </el-button>
                  <el-button @click="testCookie" :loading="testing">
                    <span class="i-carbon-renew mr-1"></span>
                    测试连接
                  </el-button>
                </el-space>
              </div>

              <!-- Cookie 输入表单 -->
              <template v-else>
                <div class="manual-steps-card">
                  <div class="steps-header">
                    <span class="i-carbon-information text-blue-500 mr-2"></span>
                    <span class="text-sm font-medium text-gray-700">如何获取 Cookie</span>
                  </div>
                  <div class="steps-list">
                    <div class="step-item">
                      <span class="step-number">1</span>
                      <span class="step-text">在浏览器中打开并登录 <a href="https://bbs.nga.cn/" target="_blank" class="text-blue-500 hover:underline">bbs.nga.cn</a></span>
                    </div>
                    <div class="step-item">
                      <span class="step-number">2</span>
                      <span class="step-text">按 <kbd>F12</kbd> 打开开发者工具</span>
                    </div>
                    <div class="step-item">
                      <span class="step-number">3</span>
                      <span class="step-text">切换到 <strong>Application</strong> → <strong>Cookies</strong> → <strong>bbs.nga.cn</strong></span>
                    </div>
                    <div class="step-item">
                      <span class="step-number">4</span>
                      <span class="step-text">复制以下 Cookie 的值：</span>
                    </div>
                  </div>
                  <div class="cookie-names">
                    <code>ngaPassportUid</code>
                    <code>ngaPassportKey</code>
                  </div>
                  <div class="format-hint">
                    <span class="text-xs text-gray-500">格式：</span>
                    <code class="text-xs">ngaPassportUid=xxx; ngaPassportKey=yyy</code>
                  </div>
                </div>

                <div class="cookie-input-area">
                  <el-input
                    v-model="form.cookie"
                    type="textarea"
                    :rows="3"
                    placeholder="粘贴你的 Cookie，例如：ngaPassportUid=12345; ngaPassportKey=abcdef..."
                    class="cookie-textarea"
                  />
                  <el-button
                    type="primary"
                    @click="saveCookie"
                    class="save-btn"
                    :disabled="!form.cookie.trim()"
                  >
                    <span class="i-carbon-checkmark mr-1"></span>
                    保存 Cookie
                  </el-button>
                </div>
              </template>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCookieStore } from '@/stores/cookie'
import { ngaApiRequest, clearCookieCache } from '@/api/nga'
import { qrLoginApi } from '@/api'
import { ElMessage } from 'element-plus'
import { Loading, ArrowLeft } from '@element-plus/icons-vue'
import QRCode from 'qrcode'

const router = useRouter()
const cookieStore = useCookieStore()

// 是否已登录且连接正常
const isLoggedIn = computed(() => cookieStore.connectionStatus === 'connected')

const testing = ref(false)

// 状态文本
const statusText = computed(() => {
  if (testing.value) return '正在检测...'
  if (isLoggedIn.value) return '已登录'
  if (cookieStore.hasCookie()) return 'Cookie 已设置'
  return '未登录'
})

// 当前登录方式
const activeLoginMethod = ref<'qrcode' | 'manual'>('qrcode')

// 是否展开二维码（已登录时默认折叠）
const showQrCode = ref(!isLoggedIn.value)

// 监听登录状态变化
const unwatch = cookieStore.$subscribe(() => {
  if (cookieStore.connectionStatus === 'connected') {
    showQrCode.value = false
  }
})

// 二维码登录相关状态
type QrCodeState = 'idle' | 'generating' | 'scanning' | 'success' | 'error'
const qrCodeState = ref<QrCodeState>('idle')
const qrCodeUrl = ref('')
const qrParams = ref<{ qrkey: string; hiddenkey: string } | null>(null)
const qrUserInfo = ref<{ username: string; uid: number } | null>(null)
const qrError = ref('')
const qrPollingInterval = ref<ReturnType<typeof setInterval> | null>(null)

const form = reactive({
  cookie: '',
})

// 初始化时加载 Cookie
onMounted(async () => {
  await cookieStore.init()
  form.cookie = cookieStore.cookie

  // 如果有 Cookie，自动测试连接
  if (cookieStore.hasCookie()) {
    await testCookie()
  }

  // 如果未连接，默认在扫码登录tab并自动开始
  if (cookieStore.connectionStatus !== 'connected') {
    startQrLogin()
  }
})

// 监听登录方式切换
watch(activeLoginMethod, (newMethod) => {
  if (newMethod === 'qrcode' && cookieStore.connectionStatus !== 'connected' && qrCodeState.value === 'idle') {
    startQrLogin()
  }
})

onUnmounted(() => {
  if (qrPollingInterval.value) {
    clearInterval(qrPollingInterval.value)
  }
  unwatch()
})

const goToHome = () => {
  router.push('/')
}

const goToForum = () => {
  router.push('/forum')
}

const saveCookie = async () => {
  if (!form.cookie.trim()) {
    ElMessage.warning('请输入 Cookie')
    return
  }
  try {
    await cookieStore.setCookie(form.cookie)
    clearCookieCache()
    ElMessage.success('Cookie 已保存')
    // 测试连接
    await testCookie()
  } catch (error: any) {
    ElMessage.error('保存 Cookie 失败: ' + (error.message || '未知错误'))
  }
}

const clearCookie = async () => {
  try {
    await cookieStore.clearCookie()
    clearCookieCache()
    form.cookie = ''
    ElMessage.success('Cookie 已清除')
    // 清除后开始二维码登录
    startQrLogin()
  } catch (error: any) {
    ElMessage.error('清除 Cookie 失败: ' + (error.message || '未知错误'))
  }
}

const testCookie = async () => {
  if (!cookieStore.hasCookie()) {
    ElMessage.warning('请先设置 Cookie')
    return
  }

  testing.value = true

  try {
    const response = await ngaApiRequest.getThreadList({
      fid: '-7955747',
      page: '1',
    })

    if (response.success) {
      cookieStore.setConnectionStatus('connected')
      ElMessage.success('连接测试成功')
    } else {
      cookieStore.setConnectionStatus('set')
      ElMessage.error('Cookie 无效')
    }
  } catch (error: any) {
    cookieStore.setConnectionStatus('set')
    ElMessage.error('连接测试失败')
  } finally {
    testing.value = false
  }
}

// 刷新二维码
const refreshQrCode = async () => {
  // 清理旧状态
  if (qrPollingInterval.value) {
    clearInterval(qrPollingInterval.value)
    qrPollingInterval.value = null
  }
  qrCodeState.value = 'idle'
  qrParams.value = null
  qrCodeUrl.value = ''
  qrUserInfo.value = null
  qrError.value = ''
  // 重新开始
  await startQrLogin()
}

// 开始二维码登录
const startQrLogin = async () => {
  qrCodeState.value = 'generating'
  qrError.value = ''
  showQrCode.value = true

  try {
    const params = await qrLoginApi.generate()
    qrParams.value = params

    // 生成二维码图片
    const qrContent = `https://bbs.nga.cn/nuke.php?__lib=login&__act=qrlogin_ui&qrkey=${params.qrkey}`

    qrCodeUrl.value = await QRCode.toDataURL(qrContent, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    qrCodeState.value = 'scanning'

    // 开始轮询登录状态
    startQrPolling()
  } catch (error: any) {
    qrError.value = `${error.message || '未知错误'}`
    qrCodeState.value = 'error'
  }
}

// 开始轮询登录状态
const startQrPolling = () => {
  if (qrPollingInterval.value) {
    clearInterval(qrPollingInterval.value)
  }

  let pollCount = 0
  const maxPolls = 120 // 最多轮询 2 分钟

  qrPollingInterval.value = setInterval(async () => {
    if (!qrParams.value || qrCodeState.value !== 'scanning') {
      clearInterval(qrPollingInterval.value!)
      return
    }

    pollCount++

    try {
      const status = await qrLoginApi.checkStatus(qrParams.value.qrkey, qrParams.value.hiddenkey)

      if (status.status === 'success') {
        clearInterval(qrPollingInterval.value!)

        if (status.uid && status.token) {
          await qrLoginApi.setCookie(status.uid, status.token)

          qrUserInfo.value = {
            username: status.username || '未知用户',
            uid: status.uid,
          }

          qrCodeState.value = 'success'

          // 刷新 Cookie 状态
          await cookieStore.init()
          form.cookie = cookieStore.cookie
          // 更新登录状态
          cookieStore.setConnectionStatus('connected')

          ElMessage.success('登录成功！')
        } else {
          qrError.value = '登录返回数据不完整'
          qrCodeState.value = 'error'
        }
      } else if (status.status.startsWith('error:')) {
        const errorMsg = status.status.substring(6)
        qrError.value = errorMsg
        qrCodeState.value = 'error'
        clearInterval(qrPollingInterval.value!)
      } else if (pollCount >= maxPolls) {
        qrError.value = '二维码已过期'
        qrCodeState.value = 'error'
        clearInterval(qrPollingInterval.value!)
      }
    } catch (error: any) {
      // 继续轮询
    }
  }, 1000)
}
</script>

<style scoped>
.login-container {
  background: #f5f5f5;
}

/* 顶部状态栏 */
.status-bar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  z-index: 10;
}

.sticky-top {
  position: sticky;
  top: 0;
}

.status-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  min-height: 52px;
  gap: 16px;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.home-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 8px;
  transition: all 0.2s;
  color: #475569;
}

.home-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.home-btn:active {
  background: #cbd5e1;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: flex-end;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.status-icon.status-success {
  background: #dcfce7;
  color: #16a34a;
}

.status-icon.status-warning {
  background: #fef3c7;
  color: #f59e0b;
}

.status-icon.status-error {
  background: #f3f4f6;
  color: #6b7280;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

/* 登录方式卡片 */
.login-methods-card {
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

:deep(.el-tabs__header) {
  margin: 0;
  background: #fafafa;
  border-radius: 8px 8px 0 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  padding: 0 24px;
  height: 48px;
  line-height: 48px;
  font-size: 14px;
  color: #64748b;
  border: none;
}

:deep(.el-tabs__item.is-active) {
  color: #3b82f6;
  font-weight: 500;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  background: #3b82f6;
  border-radius: 3px 3px 0 0;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-label :deep(.el-tag) {
  height: 18px;
  line-height: 18px;
  padding: 0 6px;
  font-size: 10px;
  border: none;
}

.tab-content {
  padding: 24px 16px;
  min-height: 280px;
}

/* 已登录提示 */
.logged-in-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
}

.logged-in-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Cookie已设置提示 */
.cookie-set-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
}

.cookie-set-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cookie-preview {
  max-width: 320px;
  word-break: break-all;
}

/* 手动输入步骤 */
.manual-steps-card {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.steps-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
}

.step-number {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.step-text {
  flex: 1;
  padding-top: 2px;
}

.step-text a {
  color: #3b82f6;
  text-decoration: none;
}

.step-text a:hover {
  text-decoration: underline;
}

.step-text strong {
  color: #1e293b;
  font-weight: 600;
}

.cookie-names {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: white;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
}

.cookie-names code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4px 8px;
  border-radius: 4px;
}

.format-hint {
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.format-hint code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #64748b;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Cookie输入区域 */
.cookie-input-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cookie-textarea :deep(.el-textarea__inner) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  padding: 12px;
  transition: all 0.2s;
}

.cookie-textarea :deep(.el-textarea__inner):focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.save-btn {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  font-weight: 500;
}

/* 二维码区域 */
.qr-card {
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.qr-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
}

.qr-scanning {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
}

.qr-image-wrapper {
  background: white;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  transition: transform 0.2s;
}

.qr-image-wrapper:hover {
  transform: scale(1.02);
}

.qr-image-wrapper img,
.qr-image-wrapper .qr-placeholder {
  width: 200px;
  height: 200px;
  display: block;
}

.qr-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #94a3b8;
  border-radius: 8px;
}

.qr-info {
  text-align: center;
}

.qr-info h3 {
  margin: 0;
}

.qr-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.qr-status-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 24px;
  color: #3b82f6;
  font-size: 13px;
  font-weight: 500;
}

.success-actions,
.error-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.qr-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  padding: 8px 16px;
  background: #f0f9ff;
  border-radius: 20px;
  color: #3b82f6;
}

.success-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.success-icon span {
  font-size: 40px;
  color: #16a34a;
}

.error-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.error-icon span {
  font-size: 40px;
  color: #dc2626;
}

/* kbd 样式 */
kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  color: #475569;
}
</style>
