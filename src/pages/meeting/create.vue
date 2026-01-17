<script setup lang="ts">
import { computed, reactive, watch, watchEffect } from 'vue'
import { createMeeting } from '@/api/meeting'
import { useUserStore } from '@/store/user'
import MeetingForm from './components/MeetingForm.vue'

definePage({
  name: 'meeting-create',
  style: {
    navigationBarTitleText: '创建会议',
  },
})

const userStore = useUserStore()
const loginInfo = computed(() => userStore.loginInfo)
const MEETING_LIST_REFRESH_KEY = 'meeting-list-refresh'

const meetingForm = reactive({
  name: '',
  type: '线上会议',
  adminUserid: '',
  host: '',
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
const MIN_START_OFFSET_MINUTES = 5

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
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = Math.min(nowMinutes + MIN_START_OFFSET_MINUTES, 23 * 60 + 59)
  meetingForm.date = formatDate(now)
  meetingForm.startTime = formatTimeFromMinutes(startMinutes)
  meetingForm.endTime = addMinutesToTime(meetingForm.startTime, 30)
  meetingForm.name = `${loginInfo.value?.real_name || ''}预定的会议`
}

initDefaultDateTime()

const minEndTime = computed(() => {
  const minTime = addMinutesToTime(meetingForm.startTime, MIN_DURATION_MINUTES)
  const { hour, minute } = parseTime(minTime)
  return { hour, minute }
})

const minStartTime = computed(() => {
  const todayLabel = formatDate(new Date())
  if (meetingForm.date !== todayLabel)
    return { hour: 0, minute: 0 }
  const now = new Date()
  const minStartMinutes = Math.min(
    now.getHours() * 60 + now.getMinutes() + MIN_START_OFFSET_MINUTES,
    23 * 60 + 59,
  )
  return { hour: Math.floor(minStartMinutes / 60), minute: minStartMinutes % 60 }
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
  const minStartMinutes = Math.min(nowMinutes + MIN_START_OFFSET_MINUTES, 23 * 60 + 59)
  if (toMinutes(meetingForm.startTime) < minStartMinutes) {
    meetingForm.startTime = formatTimeFromMinutes(minStartMinutes)
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

watchEffect(() => {
  if (!meetingForm.adminUserid && loginInfo.value?.account) {
    meetingForm.adminUserid = loginInfo.value.account
  }
})

watchEffect(() => {
  if (!meetingForm.host && loginInfo.value?.real_name) {
    meetingForm.host = loginInfo.value.real_name
  }
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

/** 转成服务端接收格式（统一在这里维护字段映射） */
function toServerPayload() {
  const ids = participantsWithAdmin.value.length
    ? participantsWithAdmin.value
    : [meetingForm.adminUserid].filter(Boolean)

  return {
    admin_userid: meetingForm.adminUserid,
    host: meetingForm.host,
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
      remind_scope: 1,
    },
  }
}

const createMeetingPayload = computed(() => toServerPayload())

async function handleCreate() {
  try {
    if (!meetingForm.adminUserid) {
      uni.showToast({ title: '请选择管理员', icon: 'none' })
      return
    }

    // ✅ 提交前：把 adminUserid 拼接进 participants（去重后回写）
    meetingForm.participants = participantsWithAdmin.value.join(',')

    // ✅ 再按服务端接收格式提交
    await createMeeting(createMeetingPayload.value)
    uni.showToast({ title: '预约会议成功', icon: 'none' })
    uni.setStorageSync(MEETING_LIST_REFRESH_KEY, true)
    setTimeout(() => {
      uni.navigateBack()
    }, 800)
  }
  catch (error) {
    console.error('create meeting failed', error)
  }
}
</script>

<template>
  <MeetingForm
    title="创建会议" submit-text="预约会议" :meeting="meetingForm"
    @update:meeting="(value) => Object.assign(meetingForm, value)" @submit="handleCreate"
  >
    <template #time>
      <view class="mb-2 bg-white px-4 py-3">
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
              <wd-datetime-picker
                v-model="meetingForm.startTime" type="time" :use-second="false"
                :min-hour="minStartTime.hour" :min-minute="minStartTime.minute"
              >
                <view class="text-center">
                  <text class="block text-5 text-#2f2f2f font-600">
                    {{ meetingForm.startTime }}
                  </text>
                  <text class="text-3 text-#9aa0a6">
                    {{ meetingForm.date }}
                  </text>
                </view>
              </wd-datetime-picker>
            </view>
            <view class="duration-wrap gap-3">
              <view class="line" />
              <text class="duration-text">
                {{ durationLabel }}
              </text>
              <view class="line" />
            </view>

            <view class="text-center">
              <wd-datetime-picker
                v-model="meetingForm.endTime" type="time" :use-second="false"
                :min-hour="minEndTime.hour" :min-minute="minEndTime.minute"
              >
                <view class="text-center">
                  <text class="block text-5 text-#2f2f2f font-600">
                    {{ meetingForm.endTime }}
                  </text>
                  <text class="text-3 text-#9aa0a6">
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

<style scoped>
.duration-wrap {
  padding: 0 16rpx;
  display: flex;
  align-items: center;
}
.line {
  width: 56rpx;
  height: 2rpx;
  background: #DADBE0;
}
.duration-text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 108rpx;
  height: 56rpx;
  background: #F6F8FA;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #333333;
  line-height: 24rpx;
}
</style>
