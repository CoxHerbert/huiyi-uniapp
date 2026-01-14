// utils/auth.js（或你原来的文件路径）

const TokenKey = 'saber3-access-token'
const RefreshTokenKey = 'saber3-refresh-token'
const SessionId = 'JSESSIONID'
const UserId = 'b-user-id'

export function getToken() {
  return uni.getStorageSync(TokenKey) || ''
}

export function setToken(token) {
  uni.setStorageSync(TokenKey, token)
  return token
}

export function getRefreshToken() {
  return uni.getStorageSync(RefreshTokenKey) || ''
}

export function setRefreshToken(token) {
  uni.setStorageSync(RefreshTokenKey, token)
  return token
}

export function removeToken() {
  uni.removeStorageSync(SessionId)
  uni.removeStorageSync(UserId)
  uni.removeStorageSync(TokenKey)
}

export function removeRefreshToken() {
  uni.removeStorageSync(RefreshTokenKey)
}
