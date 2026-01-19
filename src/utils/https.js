import { Base64 } from 'js-base64'
import website from '@/config/website'
import { useAuthStore } from '@/store/auth'
import { getToken, removeRefreshToken, removeToken } from '@/utils/auth' // 你已改成 uni.getStorageSync 的版本也没问题
import crypto from '@/utils/crypto'
import { getCurrentPath } from '@/utils'
import { serialize, tansParams } from '@/utils/util'
import { isURL, validatenull } from '@/utils/validate'

const baseUrl
  = 'https://www.eastwinbip.com/api'
function toastError(message, cfg) {
  if (cfg?.noErrorMsg)
    return
  const resolvedMessage = message || '系统错误'
  uni.showToast({ title: resolvedMessage, icon: 'none', duration: 2000 })
}

function showLoginExpiredConfirm() {
  if (isLoginModalShown)
    return
  isLoginModalShown = true
  const rawRedirect = getCurrentPath()
  const redirect = rawRedirect ? `/${rawRedirect}` : ''
  const loginUrl = redirect
    ? `/pages/login/index?redirect=${encodeURIComponent(redirect)}`
    : '/pages/login/index'
  uni.showModal({
    title: '提示',
    content: '用户令牌过期，请重新登录',
    confirmText: '去登录',
    cancelText: '取消',
    success(res) {
      if (res.confirm) {
        uni.reLaunch({ url: loginUrl })
      }
    },
    complete() {
      setTimeout(() => {
        isLoginModalShown = false
      }, 200)
    },
  })
}

// 全局只提示一次未授权
let isErrorShown = false
// 并发 401 弹窗去重
let isLoginModalShown = false

// ----------------- 小工具：合并 headers（大小写兼容） -----------------
function mergeHeaders(base = {}, extra = {}) {
  return Object.assign({}, base || {}, extra || {})
}

// ----------------- request 适配：把 axios config 规范化成 uni.request 参数 -----------------
function normalizeConfig(config = {}) {
  const cfg = { ...config }
  cfg.method = (cfg.method || 'GET').toUpperCase()
  cfg.headers = mergeHeaders(cfg.headers, cfg.header) // 兼容 header / headers
  cfg.meta = cfg.meta || {}
  return cfg
}

// 是否展示 loading（你可以改成 config.loading === true 才展示）
function startLoading(cfg) {
  if (cfg?.meta?.noLoading)
    return
  // uni.showLoading 在小程序体验更统一；你也可以删掉这段
  uni.showLoading({ title: '加载中...', mask: true })
}
function stopLoading(cfg) {
  if (cfg?.meta?.noLoading)
    return
  uni.hideLoading()
}

// ----------------- 核心：发起 uni.request（带“拦截器”逻辑） -----------------
async function uniRequestOnce(rawConfig) {
  const config = normalizeConfig(rawConfig)

  startLoading(config)
  isErrorShown = false

  try {
    // 1) baseUrl
    if (
      config.url
      && !isURL(config.url)
      && !config.url.startsWith(baseUrl)
    ) {
      config.url = baseUrl + config.url
    }

    // 2) 标准头
    config.headers['Blade-Requested-With'] = 'BladeHttpRequest'

    // 3) Basic（除非显式关闭）
    const authorization = config.authorization === false
    if (!authorization) {
      config.headers.Authorization = `Basic ${Base64.encode(
        `${website.clientId}:${website.clientSecret}`,
      )}`
    }

    // 5) Token（尊重 meta.isToken === false 与 cryptoToken）
    const isToken = config.meta.isToken === false
    const cryptoToken = config.cryptoToken === true
    const token = getToken()
    if (token && !isToken) {
      config.headers[website.tokenHeader] = cryptoToken
        ? `crypto ${crypto.encryptAES(token, crypto.cryptoKey)}`
        : `bearer ${token}`
    }

    // 6) 报文加密
    const cryptoData = config.cryptoData === true
    if (cryptoData) {
      if (config.params) {
        const data = crypto.encryptAES(JSON.stringify(config.params), crypto.aesKey)
        config.params = { data }
      }
      if (config.data) {
        config.text = true
        config.data = crypto.encryptAES(JSON.stringify(config.data), crypto.aesKey)
      }
    }

    // 7) text/plain
    if (config.text === true) {
      config.headers['Content-Type'] = 'text/plain'
    }

    // 8) form 序列化
    if (config.method === 'POST' && config.meta.isSerialize === true) {
      config.data = serialize(config.data)
      config.headers['Content-Type']
        = config.headers['Content-Type'] || 'application/x-www-form-urlencoded'
    }

    // 9) 扁平化 params → url
    if (config.params) {
      const sep = config.url.includes('?') ? '&' : '?'
      config.url += sep + tansParams(config.params)
      delete config.params
    }

    // uni.request 参数
    const reqOptions = {
      url: config.url,
      method: config.method,
      header: config.headers,
      data: config.data,
      timeout: config.timeout || 300000,
      // H5 才有意义，其他端会忽略
      withCredentials: config.withCredentials === true,
    }

    const resp = await new Promise((resolve, reject) => {
      uni.request({
        ...reqOptions,
        success: resolve,
        fail: reject,
      })
    })

    // 统一为“axios-like” res 结构，方便复用你下面的逻辑
    const res = {
      data: resp.data,
      status: resp.statusCode,
      headers: resp.header,
      config,
    }

    return res
  }
  finally {
    stopLoading(config)
  }
}

// ----------------- response 逻辑：刷新 & 重试 & 解密 -----------------
async function handleResponse(res) {
  const status = res.data?.error_code ?? res.data?.code ?? res.status
  const statusWhiteList = website.statusWhiteList || []
  const message = res.data?.msg || res.data?.error_description
  const config = res.config
  const cryptoData = config.cryptoData === true

  // 白名单：交给业务 catch
  if (statusWhiteList.includes(status)) {
    throw res
  }
  // === 401：refresh → 重试；失败则登出 & 去登录 ===
  if (status === 401) {
    if (config?.meta?.ignoreAuthRedirect) {
      throw res
    }

    // 未重试过：先 refresh 再重放
    if (!config._retried) {
      config._retried = true
      try {
        const auth = useAuthStore()
        await auth.refresh() // 刷新成功
        const retryRes = await uniRequestOnce(config)
        return handleResponse(retryRes)
      }
      catch (e) {
        if (!isErrorShown) {
          isErrorShown = true
          toastError(e, config)
        }
        const auth = useAuthStore()
        auth.logout?.()
        removeToken()
        removeRefreshToken()

        showLoginExpiredConfirm()

        throw new Error(message)
      }
    }

    // 已重试过仍 401
    if (!isErrorShown) {
      isErrorShown = true
      showLoginExpiredConfirm()
    }
    const auth = useAuthStore()
    auth.logout?.()
    removeToken()
    removeRefreshToken()

    throw new Error(message)
  }

  // oauth2 错误
  if (status > 2000 && !validatenull(res.data?.error_description)) {
    if (!isErrorShown) {
      isErrorShown = true
      toastError(message, config)
    }
    throw new Error(message)
  }

  // 非 200
  if (status !== 200) {
    toastError(message, config)
    throw new Error(message)
  }

  // 解密响应体
  if (cryptoData) {
    res.data = JSON.parse(crypto.decryptAES(res.data, crypto.aesKey))
  }
  console.log(res)
  return res
}

// ----------------- 对外：保持原有 request(config) 写法 -----------------
async function request(config) {
  try {
    const res = await uniRequestOnce(config)
    return await handleResponse(res)
  }
  catch (error) {
    // uni.request fail（断网/超时等）
    if (error && error.errMsg) {
      toastError('网络异常', config)
      throw new Error(error.errMsg)
    }
    // 业务/handleResponse 抛出的
    if (error instanceof Error)
      throw error
    throw new Error('网络异常')
  }
}

// （可选）暴露 get/post/put/delete
request.get = (url, cfg = {}) => request({ url, method: 'GET', ...cfg })
request.post = (url, data, cfg = {}) => request({ url, method: 'POST', data, ...cfg })
request.put = (url, data, cfg = {}) => request({ url, method: 'PUT', data, ...cfg })
request.delete = (url, cfg = {}) => request({ url, method: 'DELETE', ...cfg })

export default request
export { request }
