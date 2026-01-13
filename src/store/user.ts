import { defineStore } from 'pinia'
import { KEYS } from '@/constants/keys'
import { h5Apis } from '@/api'

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

const transformBtnAuths = (data: Record<string, any> = {}) => {
  const result: Record<string, any> = {}
  Object.keys(data).forEach((key) => {
    const item = data[key] || {}
    result[key] = {
      name: item.name,
      btnType: item.btnType,
      dataPromissionType: item.dataPromissionType,
      dataPromissionDeptType: item.dataPromissionDeptType,
    }
  })
  return result
}

const flattenPermissionCodes = (list: Record<string, any>[] = [], result: string[] = []) => {
  list.forEach((item) => {
    if (!isObject(item)) return
    const children = item.children
    const code = item.code
    if (Array.isArray(children) && children.length > 0) {
      flattenPermissionCodes(children, result)
    }
    else if (code) {
      result.push(code)
    }
  })
  return result
}

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: readStorage<Record<string, any> | null>(KEYS.USER_INFO, null),
    loginInfo: readStorage<Record<string, any> | null>(KEYS.LOGIN_INFO, null),
    permission: readStorage<Record<string, boolean>>(KEYS.PERMISSION, {}),
    btnPermission: readStorage<Record<string, any>>(KEYS.BTN_PERMISSION, {}),
    deptInfo: readStorage<Record<string, any> | null>(KEYS.DEPT_INFO, null),
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

    setPermission(permission: Record<string, boolean>) {
      this.permission = permission
      uni.setStorageSync(KEYS.PERMISSION, this.permission)
    },

    setBtnPermission(permission: Record<string, any>) {
      this.btnPermission = permission || {}
      uni.setStorageSync(KEYS.BTN_PERMISSION, this.btnPermission)
    },

    setDeptInfo(deptInfo: Record<string, any> | null) {
      this.deptInfo = deptInfo
      if (deptInfo) {
        uni.setStorageSync(KEYS.DEPT_INFO, deptInfo)
      }
      else {
        uni.removeStorageSync(KEYS.DEPT_INFO)
      }
    },

    reset() {
      this.setUserInfo(null)
      this.setLoginInfo(null)
      this.setPermission({})
      this.setBtnPermission({})
      this.setDeptInfo(null)
    },

    async fetchUserInfo() {
      const response = await h5Apis.user.getUserInfo()
      const payload = (response as UniApp.RequestSuccessCallbackResult)?.data || {}
      const data = (payload as Record<string, any>).data || payload
      this.setUserInfo(data as Record<string, any>)
      await this.refreshPermissionData()
      return data
    },

    async changePassword(payload: { oldPassword?: string, newPassword?: string } = {}) {
      await h5Apis.user.updatePassword({
        oldPassword: payload.oldPassword,
        newPassword: payload.newPassword,
      })
    },

    async fetchBtnPermissions() {
      try {
        const response = await h5Apis.user.getDataPermissionButtons()
        const payload = (response as UniApp.RequestSuccessCallbackResult)?.data || {}
        if ((payload as Record<string, any>).code === 200) {
          this.setBtnPermission(transformBtnAuths((payload as Record<string, any>).data?.menu || {}))
        }
      }
      catch (error) {
        console.error('获取数据级，按钮权限 数据失败', error)
      }
    },

    async fetchButtons() {
      const response = await h5Apis.user.getButtons()
      const payload = (response as UniApp.RequestSuccessCallbackResult)?.data || {}
      const list = (payload as Record<string, any>).data || []
      const codes = flattenPermissionCodes(list)
      const map: Record<string, boolean> = {}
      codes.forEach((code) => {
        map[code] = true
      })
      this.setPermission(map)
    },

    async refreshPermissionData() {
      await Promise.allSettled([this.fetchButtons(), this.fetchBtnPermissions()])
    },
  },
})
