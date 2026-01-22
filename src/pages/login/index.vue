<script setup lang="ts">
import { sendSms } from '@/api/user'
import { KEYS } from '@/constants/keys'
import { encrypt } from '@/utils/sm2'
import { isvalidatemobile } from '@/utils/validate'

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
const loading = ref(false)
const redirectPath = ref('')
const loginMode = ref<'account' | 'sms'>('account')
const smsText = ref('获取验证码')
const smsTime = ref(60)
const smsLocked = ref(false)
let smsTimer: ReturnType<typeof setInterval> | null = null

const formData = reactive({
  username: '',
  password: '',
  phone: '',
  code: '',
  codeId: '',
  tenantId: '000000',
  type: 'account',
})

onLoad((option) => {
  const redirect = option?.redirect ? decodeURIComponent(option.redirect) : ''
  redirectPath.value = redirect || ''
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
  return redirectPath.value || '/pages/meeting/index'
}

function redirectAfterLogin() {
  router.replaceAll(resolveRedirect())
}

function resetSmsTimer() {
  if (smsTimer) {
    clearInterval(smsTimer)
    smsTimer = null
  }
  smsTime.value = 60
  smsText.value = '获取验证码'
  smsLocked.value = false
}

function startSmsTimer() {
  smsLocked.value = true
  smsText.value = `${smsTime.value}秒后重试`
  smsTimer = setInterval(() => {
    smsTime.value -= 1
    if (smsTime.value <= 0) {
      resetSmsTimer()
      return
    }
    smsText.value = `${smsTime.value}秒后重试`
  }, 1000)
}

function switchMode(mode: 'account' | 'sms') {
  loginMode.value = mode
  if (mode === 'account') {
    formData.password = ''
  }
}

function onRequestPhone() {
  // #ifndef MP-WEIXIN
  globalToast.error('请在小程序端使用一键获取手机号')
  // #endif
}

function onGetPhoneNumber(event: any) {
  const detail = event?.detail || {}
  const phoneNumber = detail.phoneNumber || detail.purePhoneNumber
  if (phoneNumber) {
    formData.phone = phoneNumber
    globalToast.success('已获取手机号')
    return
  }
  if (detail.errMsg && detail.errMsg.includes('deny')) {
    globalToast.error('已取消获取手机号')
    return
  }
  globalToast.error('获取手机号失败，请手动输入')
}

async function onSendCode() {
  if (smsLocked.value)
    return
  const [hasError, message] = isvalidatemobile(formData.phone)
  if (hasError) {
    globalToast.error(message)
    return
  }
  smsLocked.value = true
  try {
    const response = await sendSms(formData.tenantId, encrypt(formData.phone))
    const payload = (response as UniApp.RequestSuccessCallbackResult)?.data || {}
    console.log(response, 'response')
    if ((payload as Record<string, any>).success) {
      formData.codeId = (payload as Record<string, any>).data?.id || ''
      globalToast.success((payload as Record<string, any>).msg || '验证码已发送')
      startSmsTimer()
      return
    }
    globalToast.error((payload as Record<string, any>).msg || '验证码发送失败')
    smsLocked.value = false
  }
  catch (error: any) {
    globalToast.error(error?.message || '验证码发送失败')
    smsLocked.value = false
  }
}

async function onSubmit() {
  if (loading.value)
    return
  if (loginMode.value === 'account') {
    if (!formData.username || !formData.password) {
      globalToast.error('请输入账号和密码')
      return
    }
  }
  else {
    const [hasError, message] = isvalidatemobile(formData.phone)
    if (hasError) {
      globalToast.error(message)
      return
    }
    if (!formData.code) {
      globalToast.error('请输入验证码')
      return
    }
  }

  loading.value = true

  try {
    if (loginMode.value === 'account') {
      await auth.loginByUsername({
        username: formData.username,
        password: formData.password,
      })

      uni.setStorageSync(KEYS.LAST_USERNAME, formData.username)
    }
    else {
      await auth.loginByPhone({
        phone: formData.phone,
        code: formData.code,
        codeId: formData.codeId,
        tenantId: formData.tenantId,
      })
    }
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

onUnmounted(() => {
  resetSmsTimer()
})
</script>

<template>
  <view class="login-page">
    <view class="login-card">
      <view class="brand">
        <image class="logo" :src="logoUrl" mode="aspectFit" />
        <text class="title">
          联合东创
        </text>
        <text class="subtitle">
          {{ loginMode === 'account' ? '请输入账号密码继续' : '请输入手机号验证码继续' }}
        </text>
      </view>

      <view class="login-switch">
        <view
          class="switch-item"
          :class="{ active: loginMode === 'account' }"
          @click="switchMode('account')"
        >
          账号密码登录
        </view>
        <view
          class="switch-item"
          :class="{ active: loginMode === 'sms' }"
          @click="switchMode('sms')"
        >
          手机号验证码登录
        </view>
      </view>

      <view class="form">
        <template v-if="loginMode === 'account'">
          <wd-input v-model="formData.username" placeholder="请输入账号" clearable />

          <wd-input
            v-model="formData.password"
            clearable
            show-password
            placeholder="请输入密码"
            class="password-input"
          />
        </template>
        <template v-else>
          <wd-input v-model="formData.phone" placeholder="请输入手机号" clearable />
          <text class="sms-tip">
            该功能暂未在小程序开放
          </text>
          <view class="code-row">
            <wd-input v-model="formData.code" placeholder="请输入验证码" clearable />
            <wd-button
              size="small"
              :disabled="smsLocked"
              :class="{ 'code-button--locked': smsLocked }"
              @click="onSendCode"
            >
              {{ smsText }}
            </wd-button>
          </view>
        </template>
      </view>

      <wd-button block type="primary" :loading="loading" @click="onSubmit">
        登录
      </wd-button>
      <wd-button
        v-if="loginMode === 'sms'"
        block
        class="phone-action"
        open-type="getPhoneNumber"
        @getphonenumber="onGetPhoneNumber"
        @click="onRequestPhone"
      >
        获取手机号
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

.login-switch {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  background: #f3f6ff;
  padding: 6px;
  border-radius: 999px;
}

.switch-item {
  flex: 1;
  text-align: center;
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 999px;
  color: #6b7280;
}

.switch-item.active {
  background: #3b82f6;
  color: #fff;
  font-weight: 600;
}

.code-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.code-row :deep(.wd-input) {
  flex: 1;
}

.code-row :deep(.wd-button) {
  width: 120px;
  padding: 0 6px;
  font-size: 12px;
}

.sms-tip {
  font-size: 12px;
  color: #f59e0b;
}

.code-button--locked {
  opacity: 0.6;
}

.phone-action {
  margin-top: 12px;
}

/* 关键：确保 wd-input 容器级别就 100% 宽度 */
.password-input {
  flex: 1;
  width: 100%;
  display: block;
}

/* 如果 wd-input 内层还有一层包装导致不满，再放开这一段（一般不需要）
:deep(.password-input) {
  width: 100%;
}
*/

.toggle {
  font-size: 12px;
  color: #3b82f6;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
}
</style>
