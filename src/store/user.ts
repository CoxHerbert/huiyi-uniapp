import { defineStore } from 'pinia'
import { KEYS } from '@/constants/keys'

const isObject = (val: unknown): val is Record<string, any> => Boolean(val) && typeof val === 'object' && !Array.isArray(val)

const readStorage = <T>(key: string, fallback: T) => {
  try {
    const value = uni.getStorageSync(key)
    return (value || fallback) as T
  }
  catch (error) {
    console.warn(`[user-store] failed to read ${key}:`, error)
    return fallback
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: readStorage<Record<string, any> | null>(KEYS.USER_INFO, null),
    loginInfo: readStorage<Record<string, any> | null>(KEYS.LOGIN_INFO, null),
  }),

  actions: {
    setUserInfo(info: Record<string, any> | null) {
      this.userInfo = info
      if (info) {
        uni.setStorageSync(KEYS.USER_INFO, info)
      }
      else {
        uni.removeStorageSync(KEYS.USER_INFO)
      }
    },

    setLoginInfo(info: Record<string, any> | null) {
      this.loginInfo = info
      if (info) {
        uni.setStorageSync(KEYS.LOGIN_INFO, info)
      }
      else {
        uni.removeStorageSync(KEYS.LOGIN_INFO)
      }
    },

    mergeLoginInfo(loginInfo: Record<string, any> | null) {
      if (!isObject(loginInfo)) {
        this.setLoginInfo(null)
        return
      }

      const mergedLoginInfo = {
        ...(this.loginInfo || {}),
        ...loginInfo,
      }
      this.setLoginInfo(mergedLoginInfo)

      if (loginInfo.user && isObject(loginInfo.user)) {
        this.setUserInfo({
          ...(this.userInfo || {}),
          ...loginInfo.user,
        })
      }
    },

    reset() {
      this.setUserInfo(null)
      this.setLoginInfo(null)
    },
  },
})
