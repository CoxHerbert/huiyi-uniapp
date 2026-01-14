import request from '@/utils/https'

function unwrap(res) {
  const payload = (res && res.data) || {}
  const { code, data, msg, message } = payload
  return { code, data, msg, message: message != null ? message : msg }
}

export default {
  // 明细列表
  getPlanId(params) {
    return request({
      url: '/blade-bip/plan/find-plan-id-by-sn',
      method: 'get',
      params,
    }).then(unwrap)
  },
  // 详情
  getPlanDetail(params) {
    return request({
      url: '/blade-bip/plan/find-plan-id-by-plan',
      method: 'get',
      params,
    }).then(unwrap)
  },
}
