import { defineStore } from 'pinia'
import h5Apis from '@/api/h5'
import { KEYS } from '@/constants/keys'
import { removeRefreshToken, removeToken, setRefreshToken, setToken } from '@/utils/auth' // 你已改成 uni.getStorageSync 的版本也没问题
import { extractLoginInfo } from '@/utils/login-info'
import { encrypt } from '@/utils/sm2'
import { useUserStore } from './user'

interface LoginForm {
  username: string
  password: string
  tenantId?: string
  deptId?: string
  roleId?: string
  type?: string
  key?: string
  code?: string
  phone?: string
  codeId?: string
}

function readStorage<T>(key: string, fallback: T) {
  try {
    const value = uni.getStorageSync(key)
    return (value || fallback) as T
  }
  catch (error) {
    console.warn(`[auth-store] failed to read ${key}:`, error)
    return fallback
  }
}

function toCsv(value?: string | string[] | null) {
  if (Array.isArray(value))
    return value.join(',')
  return value || ''
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: readStorage<string | null>(KEYS.ACCESS_TOKEN, null),
    refreshToken: readStorage<string | null>(KEYS.REFRESH_TOKEN, null),
    refreshingPromise: null as Promise<string | null> | null,
  }),

  getters: {
    isLogin: state => Boolean(state.token),
  },

  actions: {
    setTokenPair({ accessToken, refreshToken }: { accessToken?: string | null, refreshToken?: string | null }) {
      if (accessToken) {
        this.token = accessToken
        setToken(accessToken)
      }
      if (refreshToken) {
        this.refreshToken = refreshToken
        setRefreshToken(refreshToken)
      }
    },

    clearToken() {
      this.token = null
      uni.removeStorageSync(KEYS.ACCESS_TOKEN)
    },

    clearRefreshToken() {
      this.refreshToken = null
      uni.removeStorageSync(KEYS.REFRESH_TOKEN)
    },

    logout() {
      this.clearToken()
      this.clearRefreshToken()
      removeToken()
      removeRefreshToken()
      const userStore = useUserStore()
      userStore.reset()
      this.refreshingPromise = null
    },

    async loginByUsername(form: LoginForm) {
      const response = await h5Apis.auth.loginByUsername(
        form.tenantId || '000000',
        form.deptId || '',
        form.roleId || '',
        form.username,
        encrypt(form.password),
        form.type,
        form.key,
        form.code,
      )
      const payload = (response as UniApp.RequestSuccessCallbackResult)?.data || {}
      const accessToken = (payload as Record<string, any>).access_token || (payload as Record<string, any>).access_token
      const refreshToken = (payload as Record<string, any>).refresh_token || (payload as Record<string, any>).refresh_token

      this.setTokenPair({ accessToken, refreshToken })

      const userStore = useUserStore()
      const loginInfo = extractLoginInfo(payload) || {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: (payload as Record<string, any>).user,
      }

      userStore.mergeLoginInfo(loginInfo)
      await userStore.refreshPermissionData()

      return payload
    },

    async loginByPhone(form: LoginForm) {
      const response = await h5Apis.auth.loginByPhone(
        form.tenantId || '000000',
        encrypt(form.phone || ''),
        form.code,
        form.codeId,
      )
      const payload = (response as UniApp.RequestSuccessCallbackResult)?.data || {}
      const accessToken = (payload as Record<string, any>).access_token || (payload as Record<string, any>).access_token
      const refreshToken = (payload as Record<string, any>).refresh_token || (payload as Record<string, any>).refresh_token

      this.setTokenPair({ accessToken, refreshToken })

      const userStore = useUserStore()
      const loginInfo = extractLoginInfo(payload) || {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: (payload as Record<string, any>).user,
      }

      userStore.mergeLoginInfo(loginInfo)
      await userStore.refreshPermissionData()

      return payload
    },

    async refresh() {
      if (this.refreshingPromise) {
        await this.refreshingPromise
        return this.token
      }
      if (!this.refreshToken) {
        this.logout()
        throw new Error('No refresh token')
      }

      const userStore = useUserStore()
      const userInfo = userStore.userInfo || {}
      const tenantId = (userInfo as Record<string, any>).tenantId || '000000'
      const deptId = toCsv((userInfo as Record<string, any>).depts) || (userInfo as Record<string, any>).deptId || ''
      const roleId = toCsv((userInfo as Record<string, any>).roleIds) || (userInfo as Record<string, any>).roleId || ''

      this.refreshingPromise = (async () => {
        try {
          const response = await h5Apis.auth.refreshToken(this.refreshToken, tenantId, deptId, roleId)
          const payload = (response as UniApp.RequestSuccessCallbackResult)?.data || {}
          const accessToken = (payload as Record<string, any>).access_token || (payload as Record<string, any>).accessToken || (payload as Record<string, any>).token
          const nextRefreshToken
            = (payload as Record<string, any>).refresh_token || (payload as Record<string, any>).refreshToken || this.refreshToken

          if (!accessToken) {
            throw new Error('Refresh response missing access_token')
          }

          this.setTokenPair({ accessToken, refreshToken: nextRefreshToken })
          return accessToken
        }
        catch (error) {
          this.logout()
          throw error
        }
        finally {
          this.refreshingPromise = null
        }
      })()

      await this.refreshingPromise
      return this.token
    },
  },
})
