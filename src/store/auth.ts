import { defineStore } from 'pinia'
import { KEYS } from '@/constants/keys'
import { extractLoginInfo } from '@/utils/login-info'
import { useUserStore } from './user'

interface LoginForm {
  username: string
  password: string
}

const readStorage = <T>(key: string, fallback: T) => {
  try {
    const value = uni.getStorageSync(key)
    return (value || fallback) as T
  }
  catch (error) {
    console.warn(`[auth-store] failed to read ${key}:`, error)
    return fallback
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: readStorage<string | null>(KEYS.ACCESS_TOKEN, null),
    refreshToken: readStorage<string | null>(KEYS.REFRESH_TOKEN, null),
  }),

  getters: {
    isLogin: state => Boolean(state.token),
  },

  actions: {
    setTokenPair({ accessToken, refreshToken }: { accessToken?: string | null, refreshToken?: string | null }) {
      if (accessToken) {
        this.token = accessToken
        uni.setStorageSync(KEYS.ACCESS_TOKEN, accessToken)
      }
      if (refreshToken) {
        this.refreshToken = refreshToken
        uni.setStorageSync(KEYS.REFRESH_TOKEN, refreshToken)
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
      const userStore = useUserStore()
      userStore.reset()
    },

    async loginByUsername(form: LoginForm) {
      const response = await Apis.user.loginUser({
        params: {
          username: form.username,
          password: form.password,
        },
      }).send()

      const payload = (response as Record<string, any>) || {}
      const accessToken = payload.access_token || payload.accessToken || payload.token
      const refreshToken = payload.refresh_token || payload.refreshToken

      this.setTokenPair({ accessToken, refreshToken })

      const userStore = useUserStore()
      if (payload.user) {
        userStore.setUserInfo(payload.user)
      }

      const loginInfo = extractLoginInfo(payload) || {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: payload.user,
      }

      userStore.mergeLoginInfo(loginInfo)

      return payload
    },
  },
})
