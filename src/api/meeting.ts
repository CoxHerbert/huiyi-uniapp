import request from '@/utils/https'

export interface CreateMeetingPayload {
  admin_userid: string
  title: string
  meeting_start: number
  meeting_duration: number
  invitees: {
    userid: string[]
  }
}

export const createMeeting = (data: CreateMeetingPayload) =>
  request({
    url: '/blade-bip/wx/create',
    method: 'post',
    data,
  })

export const getMeetingInfo = (meetingId: string) =>
  request({
    url: '/blade-bip/wx/info',
    method: 'get',
    params: { meetingId },
  })

export const cancelMeeting = (meetingId: string) =>
  request({
    url: '/blade-bip/wx/cancel',
    method: 'get',
    params: { meetingId },
  })

export const getMeetingList = () =>
  request({
    url: '/blade-bip/wx/list',
    method: 'get',
  })
