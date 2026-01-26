<script setup lang="ts">
import { getPhoneByCode, sendSms } from '@/api/user'
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

/** ✅ 协议勾选：微信审核关键 */
const agree = ref(false)
const AGREEMENT_KEY = 'login_agree_protocol_v1'

/** 协议弹窗 */
const showPolicy = ref(false)
const policyTitle = ref('隐私政策')
const policyContent = ref('')

/** 短信倒计时 */
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

const isPhoneValid = computed(() => {
  const [hasError] = isvalidatemobile(formData.phone)
  return !hasError
})

/** 短信模式主按钮文案/行为 */
const smsPrimaryLabel = computed(() => (isPhoneValid.value ? '登录' : '获取手机号'))
const smsPrimaryOpenType = computed(() => (isPhoneValid.value ? '' : 'getPhoneNumber'))

onLoad((option) => {
  const redirect = option?.redirect ? decodeURIComponent(option.redirect) : ''
  redirectPath.value = redirect || ''

  const cachedUsername = uni.getStorageSync(KEYS.LAST_USERNAME)
  if (cachedUsername)
    formData.username = cachedUsername

  const cachedPhone = uni.getStorageSync(KEYS.LAST_PHONE)
  if (cachedPhone)
    formData.phone = cachedPhone

  // 记住用户是否勾选过（可选）
  agree.value = Boolean(uni.getStorageSync(AGREEMENT_KEY))
})

onShow(() => {
  if (auth.isLogin)
    redirectAfterLogin()
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
  // 避免重复计时器
  if (smsTimer) {
    clearInterval(smsTimer)
    smsTimer = null
  }

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

/** ✅ 必须：未同意协议禁止继续 */
function ensureAgreed() {
  if (agree.value) {
    uni.setStorageSync(AGREEMENT_KEY, true)
    return true
  }
  globalToast.error('请先阅读并同意《用户服务协议》和《隐私政策》')
  return false
}

/**
 * ✅ 微信一键获取手机号回调
 * - 你目前项目没有“解密手机号”的后端接口，所以 encryptedData/iv 场景先提示手动输入
 */
async function onGetPhoneNumber(event: any) {
  // 也要求先同意协议（更稳）
  if (!ensureAgreed())
    return

  const detail = event || {}
  const phoneCode = event.code
  const phoneNumber = event.phoneNumber || event.purePhoneNumber
  // 用户取消授权
  if (event?.errMsg && String(event.errMsg).includes('deny')) {
    globalToast.error('已取消获取手机号')
    return
  }

  // 直接拿到手机号
  if (phoneNumber) {
    formData.phone = phoneNumber
    globalToast.success('已获取手机号')
    return
  }

  if (phoneCode) {
    try {
      const response = await getPhoneByCode(phoneCode)
      const payload = (response as UniApp.RequestSuccessCallbackResult)?.data || {}
      const phone = (payload as Record<string, any>)?.data
      if ((payload as Record<string, any>).success && phone) {
        formData.phone = phone
        globalToast.success('已获取手机号')
        return
      }

      globalToast.error((payload as Record<string, any>).msg || '获取手机号失败，请手动输入')
      return
    }
    catch (error: any) {
      globalToast.error(error?.message || '获取手机号失败，请手动输入')
      return
    }
  }

  // 只有加密数据：需要后端解密
  const encryptedData = detail.encryptedData
  const iv = detail.iv
  if (encryptedData && iv) {
    /**
     * 你需要后端接口支持：
     * 1) uni.login() 拿 code
     * 2) { code, encryptedData, iv } 发给后端解密手机号
     */
    globalToast.error('获取手机号需要后端解密接口支持，请先手动输入手机号')
    return
  }

  globalToast.error('获取手机号失败，请手动输入')
}

function onRequestPhone() {
  // #ifndef MP-WEIXIN
  globalToast.error('请在微信小程序端使用一键获取手机号')
  // #endif
}

/** 主按钮点击：账号模式直接登录；短信模式手机号有效就登录，否则走获取手机号 */
function onPrimaryAction() {
  if (loginMode.value === 'account') {
    onSubmit()
    return
  }
  if (isPhoneValid.value) {
    onSubmit()
    return
  }
  onRequestPhone()
}

async function onSendCode() {
  if (smsLocked.value)
    return
  if (!ensureAgreed())
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
  if (!ensureAgreed())
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

watch(
  () => formData.phone,
  (value) => {
    if (!value)
      return
    const [hasError] = isvalidatemobile(value)
    if (!hasError)
      uni.setStorageSync(KEYS.LAST_PHONE, value)
  },
)

/** ---------------- 协议内容（可替换为跳转独立页/webview） ---------------- */
const USER_AGREEMENT_TEXT = `
《用户服务协议》

1. 本小程序仅供公司/组织内部用户使用，用于内部业务办理与账号登录等功能。
2. 使用本小程序前，请您仔细阅读并同意《用户服务协议》及《隐私政策》。
3. 您确认并同意：为实现账号登录、身份验证及内部系统使用等功能，本小程序将在取得您授权同意的前提下，按照《隐私政策》的约定收集和使用您的个人信息（包括手机号等）。
4. 如您不同意上述条款，将无法使用涉及个人信息处理的相关功能（如手机号验证码登录、发送验证码等）。
`

const PRIVACY_POLICY_TEXT = `
《隐私政策》

我们非常重视您的个人信息与隐私保护。本小程序仅供公司/组织内部用户使用。

一、我们如何收集与使用您的个人信息
（1）账号密码登录：您主动输入账号与密码用于身份校验与登录。
（2）手机号验证码登录：手机号属于个人敏感信息。在您选择使用“手机号验证码登录”功能时，我们将收集您主动输入的手机号码，用于向您发送短信验证码并完成身份验证。
短信验证码仅用于登录和安全校验目的，不会用于任何营销推广或与登录无关的场景。
验证码短信可能由我们自行发送，或由依法合规的短信服务商代为发送。
除非法律法规另有规定或获得您明确授权，我们不会向任何第三方共享、转让或公开披露您的手机号码。

二、信息存储与保护
我们将采取加密、访问控制等合理安全措施保护您的个人信息。
个人信息仅在实现本政策所述目的所必需的期限内保存，超过保存期限后将依法删除或匿名化处理。

三、您的权利
您有权访问、更正、删除您的个人信息；也可撤回授权同意（撤回后可能影响相关功能使用）。

四、联系我们
如您对本隐私政策有任何疑问，可通过公司/组织内部指定渠道联系我们。
`

function openUserAgreement() {
  policyTitle.value = '用户服务协议'
  policyContent.value = USER_AGREEMENT_TEXT.trim()
  showPolicy.value = true
}
function openPrivacyPolicy() {
  policyTitle.value = '隐私政策'
  policyContent.value = PRIVACY_POLICY_TEXT.trim()
  showPolicy.value = true
}
function closePolicy() {
  showPolicy.value = false
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

      <!-- ✅ 协议勾选区：微信审核关键（必须在触发登录/发验证码前展示并可点击查看） -->
      <view class="protocol">
        <wd-checkbox v-model="agree" shape="square">
          我已阅读并同意
        </wd-checkbox>
        <text class="protocol-links">
          <text class="link" @click="openUserAgreement">
            《用户服务协议》
          </text>
          <text>和</text>
          <text class="link" @click="openPrivacyPolicy">
            《隐私政策》
          </text>
        </text>
      </view>

      <wd-button
        block
        type="primary"
        :loading="loading"
        :open-type="loginMode === 'sms' ? smsPrimaryOpenType : ''"
        @getphonenumber="onGetPhoneNumber"
        @click="onPrimaryAction"
      >
        {{ loginMode === 'sms' ? smsPrimaryLabel : '登录' }}
      </wd-button>
    </view>

    <!-- 协议弹窗（内置文本版） -->
    <wd-popup v-model="showPolicy" position="bottom" :safe-area-inset-bottom="true">
      <view class="policy-sheet">
        <view class="policy-header">
          <text class="policy-title">
            {{ policyTitle }}
          </text>
          <text class="policy-close" @click="closePolicy">
            关闭
          </text>
        </view>
        <scroll-view scroll-y class="policy-body">
          <text class="policy-text">
            {{ policyContent }}
          </text>
        </scroll-view>
      </view>
    </wd-popup>
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
  padding: 28px 24px 22px;
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
  margin-bottom: 14px;
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

.code-button--locked {
  opacity: 0.6;
}

/* 关键：确保 wd-input 容器级别就 100% 宽度 */
.password-input {
  flex: 1;
  width: 100%;
  display: block;
}

/* ✅ 协议区 */
.protocol {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 8px 2px 14px;
}

.protocol-links {
  font-size: 12px;
  color: #6b7280;
  padding-left: 2px;
}

.link {
  color: #3b82f6;
}

/* ✅ 协议弹窗 */
.policy-sheet {
  background: #fff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  padding: 14px 14px 10px;
}

.policy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 2px 10px;
}

.policy-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.policy-close {
  font-size: 13px;
  color: #3b82f6;
}

.policy-body {
  height: 55vh;
  padding: 8px 2px 12px;
}

.policy-text {
  font-size: 13px;
  color: #374151;
  line-height: 20px;
  white-space: pre-wrap;
}
</style>
