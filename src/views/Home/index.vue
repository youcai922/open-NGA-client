<template>
  <div class="home-container">
    <div class="home-card">
      <div class="logo-area">
        <h1 class="app-title">open-NGA-client</h1>
        <p class="app-subtitle">NGA 论坛本地桌面客户端</p>
      </div>

      <div class="action-area">
        <!-- 只有连接正常时才显示进入论坛 -->
        <el-button
          v-if="cookieStore.connectionStatus === 'connected'"
          type="primary"
          size="large"
          @click="goToForum"
          class="action-btn"
        >
          进入论坛
        </el-button>
        <el-button size="large" @click="goToLogin" class="action-btn">
          账号登录
        </el-button>
      </div>

      <div class="status-area">
        <div class="status-left">
          <el-tag :type="cookieStore.getStatusType() as any" size="large">
            {{ cookieStore.getStatusText() }}
          </el-tag>
        </div>
        <el-popover placement="bottom" width="360" trigger="hover">
          <template #reference>
            <el-icon class="info-btn" :size="18">
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 832a384 384 0 1 0 0-768 384 384 0 0 0 0 768zM464 336a48 48 0 1 1 96 0 48 48 0 0 1-96 0zm72 112v224h-48V448h48z"></path>
              </svg>
            </el-icon>
          </template>
          <div class="about-content">
            <div class="about-left">
              <h4 class="about-title">项目地址： 欢迎Star</h4>
              <el-button
                type="primary"
                size="small"
                @click="openGithub"
              >
                <svg style="width: 16px; height: 16px; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                访问仓库
              </el-button>
            </div>
            <div class="divider"></div>
            <div class="about-right">
              <h4 class="about-title">支持作者</h4>
              <img
                src="/qrcode.png"
                alt="收款码"
                class="qrcode-img"
              />
            </div>
          </div>
        </el-popover>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCookieStore } from '@/stores/cookie'
import { ngaApiRequest } from '@/api/nga'
import { invoke } from '@tauri-apps/api/core'
import { ElMessage } from 'element-plus'

const router = useRouter()
const cookieStore = useCookieStore()

const goToForum = () => {
  router.push('/forum')
}

const goToLogin = () => {
  router.push('/login')
}

const openGithub = async () => {
  try {
    await invoke('open_url', { url: 'https://github.com/youcai922/open-NGA-client' })
  } catch (error) {
    console.error('打开仓库失败:', error)
    ElMessage.error('打开仓库失败')
  }
}

onMounted(async () => {
  await cookieStore.init()
  if (cookieStore.hasCookie()) {
    try {
      const response = await ngaApiRequest.getThreadList({
        fid: '-7955747',
        page: '1',
      })
      if (response.success) {
        cookieStore.setConnectionStatus('connected')
      } else {
        cookieStore.setConnectionStatus('set')
      }
    } catch {
      cookieStore.setConnectionStatus('set')
    }
  }
})
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #fef3c7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 48px 64px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 360px;
}

.logo-area {
  text-align: center;
  margin-bottom: 40px;
}

.app-title {
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.action-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-bottom: 32px;
}

.action-btn {
  width: 100%;
  height: 48px;
  font-size: 15px !important;
  border-radius: 12px;
  padding: 0 !important;
  margin: 0 !important;
  text-align: center !important;
  border: 1px solid #dcdfe6 !important;
}

.action-btn.el-button--primary {
  border-color: #409eff !important;
}

.action-btn :deep(.el-button__content) {
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 100% !important;
  width: 100% !important;
  gap: 0 !important;
}

.action-btn :deep(.el-button__content) span {
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
}

.status-area {
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.status-left {
  display: flex;
  align-items: center;
}

.info-btn {
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.info-btn:hover {
  color: #3b82f6;
}

.about-content {
  display: flex;
  align-items: stretch;
  gap: 16px;
  padding: 4px 0;
}

.about-left,
.about-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.about-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.divider {
  width: 1px;
  background: #e5e7eb;
  margin: 8px 0;
}

.qrcode-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.about-area {
  padding-top: 16px;
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
