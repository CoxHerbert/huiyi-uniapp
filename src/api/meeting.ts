import request from '@/utils/https'

export interface CreateMeetingPayload {
  admin_userid: string
  title: string
  meeting_start: number
  meeting_duration: number
  description?: string
  location?: string
  users?: string
  hostUser?: string
  invitees: {
    userid: string[]
  }
  settings?: {
    password?: string
    host?: string[]
  }
}

export function createMeeting(data: CreateMeetingPayload) {
  return request({
    url: '/blade-bip/wx/create',
    method: 'post',
    data,
  })
}

export function updateMeeting(data: CreateMeetingPayload) {
  return request({
    url: '/blade-bip/wx/update',
    method: 'post',
    data,
  })
}

export function getMeetingInfo(meetingId: string) {
  return request({
    url: '/blade-bip/wx/info',
    method: 'get',
    params: { meetingId },
  })
}

export function cancelMeeting(meetingId: string) {
  return request({
    url: '/blade-bip/wx/cancel',
    method: 'get',
    params: { meetingId },
  })
}

export function getMeetingList(params?: { type?: number }) {
  return request({
    url: '/blade-bip/wx/list',
    method: 'get',
    params,
  })
}
