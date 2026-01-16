<script setup lang="ts">
import { KEYS } from '@/constants/keys'

definePage({
  name: 'login',
  style: {
    navigationBarTitleText: '登录',
  },
})

const auth = useAuthStore()
const globalToast = useGlobalToast()
const router = useRouter()

const logoUrl = '/static/logo.png'
const showPassword = ref(false)
const loading = ref(false)
const redirectPath = ref('')

const formData = reactive({
  username: 'EW-6504',
  password: '123456',
  type: 'account',
})

onLoad((option) => {
  redirectPath.value = option?.redirect || ''
  const cachedUsername = uni.getStorageSync(KEYS.LAST_USERNAME)
  if (cachedUsername) {
    formData.username = cachedUsername
  }
})

onShow(() => {
  if (auth.isLogin) {
    redirectAfterLogin()
  }
})

function resolveRedirect() {
  return redirectPath.value || '/pages/index/index'
}

function redirectAfterLogin() {
  router.replaceAll(resolveRedirect())
}

async function onSubmit() {
  if (!formData.username || !formData.password) {
    globalToast.error('请输入账号和密码')
    return
  }

  if (loading.value)
    return
  loading.value = true

  try {
    await auth.loginByUsername({
      username: formData.username,
      password: formData.password,
    })

    uni.setStorageSync(KEYS.LAST_USERNAME, formData.username)
    globalToast.success('登录成功')
    redirectAfterLogin()
  }
  catch (error: any) {
    const message = error?.error?.message || error?.message || '登录失败，请重试'
    globalToast.error(message)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="login-page">
    <view class="login-card">
      <view class="brand">
        <image class="logo" :src="logoUrl" mode="aspectFit" />
        <text class="title">
          慧医登录
        </text>
        <text class="subtitle">
          请输入账号密码继续
        </text>
      </view>

      <view class="form">
        <wd-input v-model="formData.username" placeholder="请输入账号" clearable :no-border="true" />

        <view class="password-row">
          <wd-input
            v-model="formData.password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" clearable
            class="password-input" :no-border="true"
          />
          <view class="toggle" @click="showPassword = !showPassword">
            {{ showPassword ? '隐藏' : '显示' }}
          </view>
        </view>
      </view>

      <wd-button block type="primary" :loading="loading" @click="onSubmit">
        登录
      </wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #e6efff 0%, #d8e8ff 52%, #d6e6ff 100%);
  padding: 24px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px 32px;
  box-shadow: 0 12px 30px rgba(38, 64, 120, 0.15);
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.logo {
  width: 72px;
  height: 72px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2a44;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.password-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.password-input {
  flex: 1;
}

.toggle {
  font-size: 12px;
  color: #3b82f6;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
}
</style>
