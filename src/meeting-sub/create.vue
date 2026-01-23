<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { createMeeting, getMeetingInfo } from '@/api/meeting'
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
  hosts: [] as string[],
  participantNames: [] as string[],
  users: [] as Array<{ realName: string, account: string }>,
  hostUser: [] as Array<{ realName: string, account: string }>,
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

interface MeetingMember {
  userid?: string
}

interface MeetingInfoApi {
  title?: string
  meeting_start?: number
  meeting_duration?: number
  location?: string
  description?: string
  attendees?: { member?: MeetingMember[] }
  settings?: { password?: string, host?: string[] }
  userName?: any
  users?: any
  hostUser?: any
}

const MIN_DURATION_MINUTES = 5
const MIN_START_OFFSET_MINUTES = 5
const QUICK_DURATION_OPTIONS = [30, 60, 90, 120]

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
  // meetingForm.users = [{ account: 'EW-1130', realName: '费斌' }, { account: 'EW-5029', realName: '杨云云' }, { account: 'EW-0264', realName: '姚永' }, { account: 'EW-1310', realName: '杨玛丽' }, { account: 'EW-7202', realName: '王婵' }, { account: 'EW-7174', realName: '郑尘澜' }, { account: 'EW-3781', realName: '岳伟' }, { account: 'EW-4082', realName: '苏秋叶' }, { account: 'EW-6285', realName: '陈秋平' }, { account: 'EW-2150', realName: '陆志广' }, { account: 'EW-4738', realName: '田志平' }, { account: 'EW-2936', realName: '易长发' }, { account: 'EW-1232', realName: '王威' }, { account: 'EW-3822', realName: '郑文珍' }, { account: 'EW-5218', realName: '陈敏屏' }, { account: 'EW-1329', realName: '何静' }, { account: 'EW-6932', realName: '周任冬' }, { account: 'EW-6458', realName: '张敏儿' }, { account: 'EW-3615', realName: '叶因婷' }, { account: 'EW-4643', realName: '姚彩冰' }, { account: 'EW-0068', realName: '王维真' }, { account: 'EW-1097', realName: '林成志' }, { account: 'EW-1982', realName: '刘经伟' }, { account: 'EW-2577', realName: '唐磊' }, { account: 'EW-0628', realName: '姜剑' }, { account: 'EW-1847', realName: '郭敏' }, { account: 'EW-7311', realName: '唐双玉' }, { account: 'EW-1996', realName: '赵露兵' }, { account: 'EW-0931', realName: '凌圭' }, { account: 'EW-6095', realName: '曾伶俐' }, { account: 'EW-1993', realName: '赵婷' }, { account: 'EW-4792', realName: '王帅' }, { account: 'LiZhiLing', realName: '李智灵' }, { account: 'EW-3987', realName: '陈伟华' }, { account: 'EW-4571', realName: '席国洪' }, { account: 'EW-0524', realName: '甘亮' }, { account: 'EW-6242', realName: '郝晓勇' }, { account: 'EW-1977', realName: '曾闪林' }, { account: 'EW-2052', realName: '周建峰' }, { account: 'EW-6395', realName: '黎洁飘' }, { account: 'EW-5111', realName: '滕仕富' }, { account: 'EW-3039', realName: '向智勇' }, { account: 'EW-7079', realName: '余汉金' }, { account: 'EW-0831', realName: '王成' }, { account: 'EW-0053', realName: '李宁松' }, { account: 'EW-1429', realName: '孙亚仓' }, { account: 'EW-1472', realName: '黄秋明' }, { account: 'EW-1998', realName: '肖凡' }, { account: 'EW-2037', realName: '晏飞' }, { account: 'EW-4726', realName: '刘晖龙' }, { account: 'EW-5818', realName: '江丽元' }, { account: 'EW-6126', realName: '何清华' }, { account: 'EW-5024', realName: '陈昌祥' }, { account: 'EW-3318', realName: '杨震' }, { account: 'EW-2935', realName: '崔欢欢' }, { account: 'EW-2128', realName: '廖小仔' }, { account: 'EW-4568', realName: '杨全树' }, { account: 'EW-4484', realName: '吴超' }, { account: 'EW-0204', realName: '曹达辉' }, { account: 'EW-0498', realName: '尹平芳' }, { account: 'EW-1178', realName: '陈宗钦' }, { account: 'EW-1314', realName: '陈星' }, { account: 'EW-1953', realName: '方娜' }, { account: 'EW-6364', realName: '黄琪' }, { account: 'EW-6356', realName: '黄静妍' }, { account: 'EW-6366', realName: '韦兰俏' }, { account: 'EW-7066', realName: '刘秋香' }, { account: 'EW-2650', realName: '蒋美飞' }, { account: 'EW-6080', realName: '陆火玲' }, { account: 'EW-0502', realName: '肖兴' }, { account: 'EW-1123', realName: '熊超' }, { account: 'EW-0520', realName: '李军' }, { account: 'EW-0587', realName: '张彦' }, { account: 'EW-1189', realName: '夏志峰' }, { account: 'EW-1424', realName: '刘建光' }, { account: 'EW-1428', realName: '容凤' }, { account: 'EW-1750', realName: '陈凤' }, { account: 'EW-1870', realName: '林伟奇' }, { account: 'EW-3251', realName: '王金奎' }, { account: 'EW-3584', realName: '聂宏明' }, { account: 'EW-3766', realName: '胡家福' }, { account: 'EW-4479', realName: '李江' }, { account: 'EW-4334', realName: '郭慧阳' }, { account: 'EW-5471', realName: '熊顺刚' }, { account: 'EW-5618', realName: '王正祺' }, { account: 'EW-6949', realName: '代新平' }, { account: 'EW-5968', realName: '赖均勇' }, { account: 'EW-6383', realName: '梁春锦' }, { account: 'EW-6399', realName: '韦建全' }, { account: 'EW-6903', realName: '邓飞' }, { account: 'EW-6913', realName: '黄维玉' }, { account: 'EW-7332', realName: '王宽' }, { account: 'EW-5887', realName: '曹忠爵' }, { account: 'EW-5085', realName: '卢如玉' }, { account: 'EW-6206', realName: '黄嘉乐' }, { account: 'EW-6945', realName: '陈斌' }, { account: 'EW-6440', realName: '杜梦琦' }, { account: 'EW-1970', realName: '何江' }, { account: 'EW-3732', realName: '王浪' }, { account: 'EW-5599', realName: '朱东阳' }, { account: 'EW-6173', realName: '杨静静' }, { account: 'EW-7160', realName: '龙思羽' }, { account: 'EW-7208', realName: '蓝子淇' }, { account: 'EW-4961', realName: '马剑' }, { account: 'EW-6104', realName: '王亮' }, { account: 'EW-6129', realName: '何嘉诚' }, { account: 'EW-6176', realName: '王芝林' }, { account: 'EW-6504', realName: '鲍泽楠' }, { account: 'EW-7158', realName: '李海洋' }, { account: 'EW-7169', realName: '曾靖洲' }, { account: 'EW-7223', realName: '贺晨超' }, { account: 'EW-7361', realName: '曹顺' }]

  const now = new Date()
  meetingForm.date = formatDate(now)
  meetingForm.name = `${loginInfo.value?.real_name || ''}预定的会议`

  const startAt = new Date(now)
  startAt.setSeconds(0, 0)
  startAt.setMinutes(startAt.getMinutes() + MIN_START_OFFSET_MINUTES)
  meetingForm.startTime = formatTime(startAt)
  meetingForm.endTime = addMinutesToTime(meetingForm.startTime, 30)
}

initDefaultDateTime()

function parseDate(value: string) {
  const normalized = value.replace(/-/g, '/')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseDateTimeValue(value: string | number) {
  if (typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  const normalized = String(value).replace(/-/g, '/')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const meetingDateValue = computed<number>({
  get() {
    const parsed = parseDate(meetingForm.date)
    if (parsed)
      return parsed.getTime()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.getTime()
  },
  set(value) {
    const parsed = parseDateTimeValue(value)
    if (!parsed)
      return
    meetingForm.date = formatDate(parsed)
  },
})

const minDate = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.getTime()
})

function timePickerFilter(type: string, values: number[]) {
  if (type === 'minute')
    // return values.filter(value => value % 5 === 0)
    return values
  if (type === 'hour') {
    const todayLabel = formatDate(new Date())
    if (meetingForm.date === todayLabel) {
      const nowHour = new Date().getHours()
      return values.filter(value => value >= nowHour)
    }
  }
  return values
}

const customDurationMinutes = ref('')

function ensureDateNotPast() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selected = parseDate(meetingForm.date)
  if (!selected || selected.getTime() < today.getTime()) {
    meetingForm.date = formatDate(today)
  }
}

function ensureStartNotPast() {
  if (!meetingForm.startTime)
    return
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
  if (!meetingForm.startTime || !meetingForm.endTime)
    return
  const minEndMinutes = Math.min(
    toMinutes(meetingForm.startTime) + MIN_DURATION_MINUTES,
    23 * 60 + 59,
  )
  if (toMinutes(meetingForm.endTime) < minEndMinutes) {
    meetingForm.endTime = formatTimeFromMinutes(minEndMinutes)
  }
}

function ensureEndAfterStart() {
  if (!meetingForm.startTime || !meetingForm.endTime)
    return
  if (toMinutes(meetingForm.endTime) <= toMinutes(meetingForm.startTime)) {
    const minEndMinutes = Math.min(
      toMinutes(meetingForm.startTime) + MIN_DURATION_MINUTES,
      23 * 60 + 59,
    )
    meetingForm.endTime = formatTimeFromMinutes(minEndMinutes)
  }
}

function resolveDefaultStartTime() {
  const now = new Date()
  const todayLabel = formatDate(now)
  if (meetingForm.date === todayLabel) {
    now.setSeconds(0, 0)
    now.setMinutes(now.getMinutes() + MIN_START_OFFSET_MINUTES)
    return formatTime(now)
  }
  return '09:00'
}

function normalizeDuration(minutes: number) {
  if (!Number.isFinite(minutes))
    return null
  const clamped = Math.max(minutes, MIN_DURATION_MINUTES)
  return Math.ceil(clamped / 5) * 5
}

function applyDuration(minutes: number) {
  const normalized = normalizeDuration(minutes)
  if (!normalized) {
    uni.showToast({ title: '请输入有效时长', icon: 'none' })
    return
  }
  if (!meetingForm.date)
    meetingForm.date = formatDate(new Date())
  if (!meetingForm.startTime)
    meetingForm.startTime = resolveDefaultStartTime()
  meetingForm.endTime = addMinutesToTime(meetingForm.startTime, normalized)
}

function applyCustomDuration() {
  const raw = Number(customDurationMinutes.value)
  if (!raw) {
    uni.showToast({ title: '请输入时长（分钟）', icon: 'none' })
    return
  }
  const normalized = normalizeDuration(raw)
  if (!normalized)
    return
  if (normalized !== raw) {
    uni.showToast({ title: `已自动调整为${normalized}分钟`, icon: 'none' })
  }
  customDurationMinutes.value = String(normalized)
  applyDuration(normalized)
}

function parseUserNames(input: any): string[] {
  if (input === null || input === undefined || input === '')
    return []

  if (Array.isArray(input))
    return input.map((x: any) => String(x)).filter(Boolean)

  if (typeof input === 'string') {
    const str = input.trim()
    if (!str)
      return []

    if (str.startsWith('[')) {
      try {
        const arr = JSON.parse(str)
        if (Array.isArray(arr))
          return arr.map((x: any) => String(x)).filter(Boolean)
      }
      catch (e) {
        // ignore
      }
    }

    return str.split(/[,，]/).map(s => s.trim()).filter(Boolean)
  }

  return [String(input)].filter(Boolean)
}

function parseUsers(input: any): Array<{ realName: string, account: string }> {
  if (!input)
    return []

  if (Array.isArray(input)) {
    return input
      .map((item: any) => ({
        realName: String(item?.realName ?? '').trim(),
        account: String(item?.account ?? '').trim(),
      }))
      .filter(item => item.realName || item.account)
  }

  if (typeof input === 'string') {
    const text = input.trim()
    if (!text)
      return []
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: any) => ({
            realName: String(item?.realName ?? '').trim(),
            account: String(item?.account ?? '').trim(),
          }))
          .filter(item => item.realName || item.account)
      }
    }
    catch (error) {
      return []
    }
  }

  return []
}

function parseHostUsers(input: any): Array<{ realName: string, account: string }> {
  return parseUsers(input)
}

function shouldFilterAttendee(userid?: string) {
  return typeof userid === 'string' && /^EW-M[1-6]$/.test(userid)
}

function resolveAttendeeIds(attendees?: { member?: MeetingMember[] }) {
  const members = attendees?.member ?? []
  return Array.isArray(members)
    ? members
        .map(item => item?.userid)
        .filter(userid => !shouldFilterAttendee(userid))
        .filter((value): value is string => !!value)
    : []
}

function applyMeetingToForm(data: MeetingInfoApi) {
  meetingForm.name = data.title ?? meetingForm.name
  meetingForm.location = data.location ?? ''
  meetingForm.description = data.description ?? ''
  meetingForm.password = data.settings?.password ?? ''

  const hostUsers = parseHostUsers(data.hostUser)
  if (hostUsers.length) {
    meetingForm.hostUser = hostUsers
    meetingForm.hosts = hostUsers.map(user => user.account).filter(Boolean)
  }
  else {
    meetingForm.hosts = data.settings?.host ?? meetingForm.hosts
    meetingForm.hostUser = meetingForm.hosts.map(account => ({
      account,
      realName: '',
    }))
  }

  const users = parseUsers(data.users)
  if (users.length) {
    meetingForm.users = users
    meetingForm.participants = users.map(user => user.account).filter(Boolean).join(',')
    meetingForm.participantNames = users.map(user => user.realName).filter(Boolean)
  }
  else {
    const attendeeIds = resolveAttendeeIds(data.attendees)
    const names = parseUserNames(data.userName)
    meetingForm.participants = attendeeIds.join(',')
    meetingForm.participantNames = names
    meetingForm.users = attendeeIds.map((account, index) => ({
      account,
      realName: names[index] || '',
    }))
  }

  const durationSec = Number(data.meeting_duration || 0)
  if (durationSec) {
    meetingForm.date = formatDate(new Date())
    meetingForm.startTime = resolveDefaultStartTime()
    applyDuration(Math.max(Math.round(durationSec / 60), MIN_DURATION_MINUTES))
  }
}

async function loadMeetingInfo(meetingId?: string) {
  if (!meetingId)
    return
  try {
    const res: any = await getMeetingInfo(meetingId)
    const data: MeetingInfoApi = res?.data?.data || res?.data || {}
    applyMeetingToForm(data)
  }
  catch (error) {
    console.error('fetch meeting info failed', error)
    uni.showToast({ title: '获取会议详情失败', icon: 'none' })
  }
}

watch(
  () => [meetingForm.date, meetingForm.startTime, meetingForm.endTime],
  () => {
    ensureDateNotPast()
    ensureStartNotPast()
    ensureMinimumDuration()
    ensureEndAfterStart()
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
  if (!meetingForm.hosts.length && loginInfo.value?.account) {
    meetingForm.hosts = [loginInfo.value.account]
  }
})

watchEffect(() => {
  const loginAccount = loginInfo.value?.account
  if (!loginAccount)
    return
  if (!meetingForm.hostUser.length) {
    meetingForm.hostUser = [{
      account: loginAccount,
      realName: loginInfo.value?.real_name || '',
    }]
  }
})

watchEffect(() => {
  const account = loginInfo.value?.account
  if (!account)
    return
  if (!meetingForm.users.some(user => user.account === account)) {
    meetingForm.users = [
      ...meetingForm.users,
      { account, realName: loginInfo.value?.real_name || '' },
    ]
  }
  const ids = meetingForm.users.map(user => user.account).filter(Boolean)
  if (ids.length)
    meetingForm.participants = ids.join(',')
  meetingForm.participantNames = meetingForm.users
    .map(user => user.realName)
    .filter(Boolean)
})

/** 解析参与人字符串（支持 、 , ，） */
function parseUserIds(value: string) {
  return value
    .split(/[、,，]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function buildUsers() {
  const ids = parseUserIds(meetingForm.participants)
  const nameByAccount = new Map<string, string>()

  meetingForm.users.forEach((user) => {
    if (user.account)
      nameByAccount.set(user.account, user.realName)
  })

  meetingForm.participantNames.forEach((name, index) => {
    const account = ids[index]
    if (account && name && !nameByAccount.has(account))
      nameByAccount.set(account, name)
  })

  const loginAccount = loginInfo.value?.account
  if (loginAccount && !nameByAccount.has(loginAccount))
    nameByAccount.set(loginAccount, loginInfo.value?.real_name || '')

  return ids.map(account => ({
    account,
    realName: nameByAccount.get(account) || '',
  }))
}

function buildHostUsers() {
  const accounts = meetingForm.hosts
  const nameByAccount = new Map<string, string>()

  meetingForm.hostUser.forEach((user) => {
    if (user.account)
      nameByAccount.set(user.account, user.realName)
  })

  const loginAccount = loginInfo.value?.account
  if (loginAccount && !nameByAccount.has(loginAccount))
    nameByAccount.set(loginAccount, loginInfo.value?.real_name || '')

  return accounts.map(account => ({
    account,
    realName: nameByAccount.get(account) || '',
  }))
}

/** 转成服务端接收格式（统一在这里维护字段映射） */
function toServerPayload() {
  const users = meetingForm.users.length ? meetingForm.users : buildUsers()
  const hostUser = meetingForm.hostUser.length ? meetingForm.hostUser : buildHostUsers()
  const ids = users.map(user => user.account).filter(Boolean)
  const hostIds = hostUser.map(user => user.account).filter(Boolean)

  return {
    title: meetingForm.name,
    meeting_start: meetingStartTimestamp.value,
    meeting_duration: meetingDurationSeconds.value,
    description: meetingForm.description,
    location: meetingForm.location,
    users: JSON.stringify(users),
    hostUser: JSON.stringify(hostUser),
    invitees: {
      userid: ids,
    },
    settings: {
      password: meetingForm.password,
      host: hostIds,
      remind_scope: 1,
    },
  }
}

const createMeetingPayload = computed(() => toServerPayload())

async function handleCreate() {
  try {
    // const users = JSON.parse(createMeetingPayload.value.users)
    // const accounts = users.map((user: { account: string }) => user.account)
    // const payload = {
    //   ...createMeetingPayload.value,
    //   invitees: {
    //     userid: accounts,
    //   },
    // }
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

onLoad((options) => {
  if (options?.meetingId)
    loadMeetingInfo(String(options.meetingId))
})
</script>

<template>
  <MeetingForm
    title="创建会议" submit-text="预约会议" :meeting="meetingForm"
    @update:meeting="(value) => Object.assign(meetingForm, value)" @submit="handleCreate"
  >
    <template #time>
      <view class="mb-2 bg-white px-4 py-3">
        <view class="time-picker-grid">
          <view class="time-picker-row">
            <text class="time-label">
              会议日期
            </text>
            <wd-calendar v-model="meetingDateValue" :min-date="minDate">
              <view class="time-picker-cell">
                <text class="time-value">
                  {{ meetingForm.date || '请选择日期' }}
                </text>
                <wd-icon name="arrow-right" size="14px" color="#c4c7cc" />
              </view>
            </wd-calendar>
          </view>
        </view>
        <view class="mt-3">
          <view class="flex items-center justify-center">
            <view class="flex items-center gap-6">
              <wd-datetime-picker
                v-model="meetingForm.startTime"
                type="time"
                :filter="timePickerFilter"
                :use-second="false"
              >
                <view class="text-center">
                  <text class="block text-5 text-#2f2f2f font-600">
                    {{ meetingForm.startTime || '--:--' }}
                  </text>
                  <text class="text-3 text-#9aa0a6">
                    {{ meetingForm.date }}
                  </text>
                </view>
              </wd-datetime-picker>
              <view class="duration-wrap gap-3">
                <view class="line" />
                <text class="duration-text">
                  {{ durationLabel }}
                </text>
                <view class="line" />
              </view>
              <wd-datetime-picker
                v-model="meetingForm.endTime"
                type="time"
                :filter="timePickerFilter"
                :use-second="false"
              >
                <view class="text-center">
                  <text class="block text-5 text-#2f2f2f font-600">
                    {{ meetingForm.endTime || '--:--' }}
                  </text>
                  <text class="text-3 text-#9aa0a6">
                    {{ meetingForm.date }}
                  </text>
                </view>
              </wd-datetime-picker>
            </view>
          </view>
        </view>
        <view class="mt-3 flex flex-col gap-2">
          <!-- <text class="text-3 text-#9aa0a6">
            时间以 5 分钟为单位，结束时间需晚于开始时间
          </text> -->
          <view class="duration-actions">
            <view class="duration-shortcuts">
              <text class="shortcut-label">
                快捷时长
              </text>
              <view class="shortcut-list">
                <view
                  v-for="minutes in QUICK_DURATION_OPTIONS"
                  :key="minutes"
                  class="shortcut-item"
                  @click.stop="applyDuration(minutes)"
                >
                  {{ minutes }}分钟
                </view>
              </view>
            </view>
            <view class="duration-input-wrap">
              <text class="shortcut-label">
                自定义
              </text>
              <wd-input
                :model-value="customDurationMinutes"
                type="number"
                placeholder="输入分钟"
                custom-class="duration-input"
                @update:model-value="(value) => customDurationMinutes = value"
              />
              <text class="duration-unit">
                分钟
              </text>
              <wd-button size="small" type="primary" @click.stop="applyCustomDuration">
                应用
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </template>
  </MeetingForm>
</template>

<style scoped>
.time-picker-grid {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.time-picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.time-label {
  font-size: 26rpx;
  color: #8a8f99;
}

.time-picker-cell {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.time-value {
  font-size: 28rpx;
  color: #2f2f2f;
}

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
.duration-shortcuts {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.shortcut-label {
  font-size: 24rpx;
  color: #9aa0a6;
}

.shortcut-list {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.shortcut-item {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #eef2ff;
  font-size: 24rpx;
  color: #4f7bff;
}

.duration-input-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
  justify-content: flex-end;
}

.duration-input :deep(.wd-input__inner) {
  width: 140rpx;
  text-align: right;
}

.duration-unit {
  font-size: 24rpx;
  color: #9aa0a6;
}

.duration-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
</style>
