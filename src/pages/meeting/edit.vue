<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { getMeetingInfo, updateMeeting } from '@/api/meeting'
import MeetingForm from './components/MeetingForm.vue'

definePage({
  name: 'meeting-edit',
  style: {
    navigationBarTitleText: '编辑会议',
  },
})

interface MeetingMember {
  userid?: string
}

interface MeetingInfoApi {
  title?: string
  meeting_start?: number
  meeting_duration?: number
  admin_userid?: string
  location?: string
  description?: string
  attendees?: { member?: MeetingMember[] }
  settings?: { password?: string }
}

const meetingId = ref('')
const pageId = ref('')

const meetingForm = reactive({
  name: '',
  type: '',
  adminUserid: '',
  startTime: '',
  endTime: '',
  date: '',
  duration: '',
  participants: '',
  room: '',
  location: '',
  password: '',
  attachment: '',
  description: '',
})

const MIN_DURATION_MINUTES = 5

function padTime(value: number) {
  return String(value).padStart(2, '0')
}

function formatDate(value: Date) {
  const year = value.getFullYear()
  const month = padTime(value.getMonth() + 1)
  const day = padTime(value.getDate())
  return `${year}/${month}/${day}`
}

function formatTime(value: Date) {
  return `${padTime(value.getHours())}:${padTime(value.getMinutes())}`
}

function formatTimeFromMinutes(totalMinutes: number) {
  const clamped = Math.min(Math.max(totalMinutes, 0), 23 * 60 + 59)
  const hour = Math.floor(clamped / 60)
  const minute = clamped % 60
  return `${padTime(hour)}:${padTime(minute)}`
}

function parseTime(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return {
    hour: Number.isNaN(hour) ? 0 : hour,
    minute: Number.isNaN(minute) ? 0 : minute,
  }
}

function toMinutes(time: string) {
  const { hour, minute } = parseTime(time)
  return hour * 60 + minute
}

function addMinutesToTime(time: string, minutes: number) {
  return formatTimeFromMinutes(toMinutes(time) + minutes)
}

function initDefaultDateTime() {
  const now = new Date()
  meetingForm.date = formatDate(now)
  meetingForm.startTime = formatTime(now)
  meetingForm.endTime = addMinutesToTime(meetingForm.startTime, 30)
}

initDefaultDateTime()

const minEndTime = computed(() => {
  const minTime = addMinutesToTime(meetingForm.startTime, MIN_DURATION_MINUTES)
  const { hour, minute } = parseTime(minTime)
  return { hour, minute }
})

function parseDate(value: string) {
  const normalized = value.replace(/-/g, '/')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function ensureDateNotPast() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selected = parseDate(meetingForm.date)
  if (!selected || selected.getTime() < today.getTime()) {
    meetingForm.date = formatDate(today)
  }
}

function ensureStartNotPast() {
  const now = new Date()
  const todayLabel = formatDate(now)
  if (meetingForm.date !== todayLabel)
    return
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  if (toMinutes(meetingForm.startTime) < nowMinutes) {
    meetingForm.startTime = formatTime(now)
  }
}

function ensureMinimumDuration() {
  const minEndMinutes = Math.min(
    toMinutes(meetingForm.startTime) + MIN_DURATION_MINUTES,
    23 * 60 + 59,
  )
  if (toMinutes(meetingForm.endTime) < minEndMinutes) {
    meetingForm.endTime = formatTimeFromMinutes(minEndMinutes)
  }
}

watch(
  () => [meetingForm.date, meetingForm.startTime, meetingForm.endTime],
  () => {
    ensureDateNotPast()
    ensureStartNotPast()
    ensureMinimumDuration()
  },
  { immediate: true },
)

const meetingStartTimestamp = computed(() => {
  const startAt = new Date(`${meetingForm.date} ${meetingForm.startTime}`)
  return Number.isNaN(startAt.getTime()) ? 0 : Math.floor(startAt.getTime() / 1000)
})

const meetingDurationSeconds = computed(() => {
  const startAt = new Date(`${meetingForm.date} ${meetingForm.startTime}`)
  const endAt = new Date(`${meetingForm.date} ${meetingForm.endTime}`)
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()))
    return 0
  const diff = endAt.getTime() - startAt.getTime()
  return diff > 0 ? Math.floor(diff / 1000) : 0
})

const durationLabel = computed(() => {
  const minutes = Math.floor(meetingDurationSeconds.value / 60)
  return `${minutes}分钟`
})

watchEffect(() => {
  meetingForm.duration = durationLabel.value
})

/** 解析参与人字符串（支持 、 , ，） */
function parseUserIds(value: string) {
  return value
    .split(/[、,，]/)
    .map(item => item.trim())
    .filter(Boolean)
}

/** 参与人 + 管理员合并，管理员强制存在，且去重（保持顺序） */
function mergeParticipantsWithAdmin(participants: string, adminUserid: string) {
  const list = parseUserIds(participants)
  const merged = [adminUserid, ...list].filter(Boolean)

  const uniq: string[] = []
  for (const id of merged) {
    if (!uniq.includes(id))
      uniq.push(id)
  }
  return uniq
}

/** 最终参与人（保证包含管理员、去重） */
const participantsWithAdmin = computed(() => {
  return mergeParticipantsWithAdmin(meetingForm.participants, meetingForm.adminUserid)
})

function resolveAttendeeIds(attendees?: { member?: MeetingMember[] }) {
  const members = attendees?.member ?? []
  return Array.isArray(members)
    ? members
        .map(item => item?.userid)
        .filter((value): value is string => !!value)
    : []
}

function applyMeetingToForm(data: MeetingInfoApi) {
  const startSec = Number(data.meeting_start || 0)
  const durationSec = Number(data.meeting_duration || 0)
  const start = startSec ? new Date(startSec * 1000) : null

  if (start) {
    meetingForm.date = formatDate(start)
    meetingForm.startTime = formatTime(start)
    const end = durationSec ? new Date((startSec + durationSec) * 1000) : null
    meetingForm.endTime = end ? formatTime(end) : addMinutesToTime(meetingForm.startTime, 30)
  }

  meetingForm.name = data.title ?? ''
  meetingForm.adminUserid = data.admin_userid ?? ''
  meetingForm.location = data.location ?? ''
  meetingForm.description = data.description ?? ''
  meetingForm.password = data.settings?.password ?? ''

  const attendeeIds = resolveAttendeeIds(data.attendees)
  meetingForm.participants = mergeParticipantsWithAdmin(attendeeIds.join(','), meetingForm.adminUserid).join(',')
}

async function loadMeetingInfo() {
  if (!meetingId.value)
    return
  try {
    const res: any = await getMeetingInfo(meetingId.value)
    const data: MeetingInfoApi = res?.data?.data || res?.data || {}
    applyMeetingToForm(data)
  }
  catch (error) {
    console.error('fetch meeting info failed', error)
    uni.showToast({ title: '获取会议详情失败', icon: 'none' })
  }
}

/** 转成服务端接收格式（统一在这里维护字段映射） */
function toServerPayload() {
  const ids = participantsWithAdmin.value.length
    ? participantsWithAdmin.value
    : [meetingForm.adminUserid].filter(Boolean)

  return {
    id: pageId.value,
    meetingId: meetingId.value,
    admin_userid: meetingForm.adminUserid,
    title: meetingForm.name,
    meeting_start: meetingStartTimestamp.value,
    meeting_duration: meetingDurationSeconds.value,
    description: meetingForm.description,
    location: meetingForm.location,
    invitees: {
      userid: ids,
    },
    settings: {
      password: meetingForm.password,
    },
  }
}

const updateMeetingPayload = computed(() => toServerPayload())

async function handleSave() {
  try {
    if (!meetingForm.adminUserid) {
      uni.showToast({ title: '请选择管理员', icon: 'none' })
      return
    }

    // ✅ 提交前：把 adminUserid 拼进 participants（去重后回写）
    meetingForm.participants = participantsWithAdmin.value.join(',')

    // ✅ 再按服务端接收格式提交
    await updateMeeting(updateMeetingPayload.value)
    uni.showToast({ title: '会议已更新', icon: 'none' })
  }
  catch (error) {
    console.error('update meeting failed', error)
    uni.showToast({ title: '更新会议失败', icon: 'none' })
  }
}

onLoad((options) => {
  if (options?.meetingId) {
    meetingId.value = String(options.meetingId)
    pageId.value = String(options.id)
  }

  loadMeetingInfo()
})
</script>

<template>
  <MeetingForm
    title="编辑会议"
    submit-text="保存"
    :meeting="meetingForm"
    @update:meeting="(value) => Object.assign(meetingForm, value)"
    @submit="handleSave"
  >
    <template #time>
      <view class="mb-2 border-#f0f1f2 bg-white px-4 py-3">
        <!-- <view class="mb-4 flex items-center justify-between">
          <text class="text-3 text-#8a8f99">
            会议日期
          </text>
          <wd-datetime-picker v-model="meetingForm.date" type="date">
            <view class="flex items-center gap-2">
              <text class="text-3 text-#2f2f2f">
                {{ meetingForm.date }}
              </text>
              <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
            </view>
          </wd-datetime-picker>
        </view> -->
        <view class="flex items-center justify-center">
          <view class="flex items-center gap-6">
            <view class="text-center">
              <wd-datetime-picker v-model="meetingForm.startTime" type="time" :use-second="false">
                <view class="text-center">
                  <text class="block text-5 text-#2f2f2f font-600">
                    {{ meetingForm.startTime }}
                  </text>
                  <text class="text-2.5 text-#9aa0a6">
                    {{ meetingForm.date }}
                  </text>
                </view>
              </wd-datetime-picker>
            </view>
            <view class="text-center">
              <text class="block bg-#F6F8FA px-1 py-2 text-2.5 text-#9aa0a6">
                {{ durationLabel }}
              </text>
            </view>
            <view class="text-center">
              <wd-datetime-picker
                v-model="meetingForm.endTime"
                type="time"
                :use-second="false"
                :min-hour="minEndTime.hour"
                :min-minute="minEndTime.minute"
              >
                <view class="text-center">
                  <text class="block text-5 text-#2f2f2f font-600">
                    {{ meetingForm.endTime }}
                  </text>
                  <text class="text-2.5 text-#9aa0a6">
                    {{ meetingForm.date }}
                  </text>
                </view>
              </wd-datetime-picker>
            </view>
          </view>
        </view>
      </view>
    </template>
  </MeetingForm>
</template>
