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

export function sendSms(tenantId: string, phone: string) {
  return request({
    url: '/blade-auth/oauth/sms/send-validate',
    method: 'post',
    params: {
      tenantId,
      phone,
    },
  })
}

export function getPhoneByCode(code: string) {
  return request({
    url: '/blade-bip/wx/skip-url/getPhone',
    method: 'get',
    params: {
      code,
    },
    meta: {
      isToken: false,
      ignoreAuthRedirect: true,
    },
  })
}
