import request from '@/utils/https'

export function getUserList(params?: Record<string, any>) {
  return request({
    url: '/blade-bip/bip-blade-user/page',
    method: 'get',
    params: {
      current: 1,
      size: 100,
      ...params,
    },
  })
}
