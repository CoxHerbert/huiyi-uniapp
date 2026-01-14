import request from '@/utils/https'

export interface CreateMeetingPayload {
  admin_userid: string
  title: string
  meeting_start: number
  meeting_duration: number
  description?: string
  location?: string
  agentid?: number
  invitees: {
    userid: string[]
  }
  settings?: {
    remind_scope?: number
    password?: string
    enable_waiting_room?: boolean
    allow_enter_before_host?: boolean
    enable_enter_mute?: number
    enable_screen_watermark?: boolean
    hosts?: {
      userid: string[]
    }
    ring_users?: {
      userid: string[]
    }
  }
  cal_id?: string
  reminders?: {
    is_repeat?: number
    repeat_type?: number
    repeat_until?: number
    repeat_interval?: number
    remind_before?: number[]
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
