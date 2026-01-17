<script setup lang="ts">
import { cancelMeeting, getMeetingInfo } from '@/api/meeting'

definePage({
  name: 'meeting-detail',
  style: {
    navigationBarTitleText: '会议详情',
  },
})

interface MeetingMember { userid: string, status?: number }
interface MeetingInfoApi {
  title?: string
  meeting_start?: number // 秒级时间戳
  meeting_duration?: number // 秒
  admin_userid?: string
  createUserName?: string
  meeting_code?: string
  location?: string
  description?: string
  status?: number | string
  statusClass?: string
  settings?: { password?: string }
  attendees?: { member?: MeetingMember[] }
  // 接口实际可能返回 JSON 字符串 / 数组 / 逗号字符串，这里用 any 兼容
  userName?: any
}

const meetingId = ref('')
const pageId = ref('')

const MEETING_DETAIL_REFRESH_KEY = 'meeting-detail-refresh'
const MEETING_LIST_REFRESH_KEY = 'meeting-list-refresh'
const meetingDetail = reactive({
  title: '-',
  status: '',
  statusClass: '',
  statusCode: undefined as number | undefined,
  startTime: '--:--',
  endTime: '--:--',
  date: '-',
  timezone: '(GMT+08:00) 中国标准时间 北京',
  host: '-',
  attendees: [] as string[],
  meetingNo: '-',
  userName: [] as string[],
  location: '-',
  description: '-',
  password: '-',

  // ✅ 新增：动态时长文本
  durationText: '--',

  tipTitle: '温馨提示',
  tipContent: '此小程序仅作会议预约，请从企业微信“会议”功能进入会议。',
})

const loading = ref(false)
const canceling = ref(false)

function pad2(n: number) {
  return String(n).padStart(2, '0')
}
function formatHM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
function formatCNDate(d: Date) {
  return `${d.getFullYear()}年${pad2(d.getMonth() + 1)}月${pad2(d.getDate())}日`
}
function safeText(v: any, fallback = '-') {
  return v === null || v === undefined || v === '' ? fallback : String(v)
}

const statusMeta = new Map<number, { label: string, className: string }>([
  [1, { label: '已创建', className: 'bg-#e7edff text-#3f5fff' }],
  [2, { label: '进行中', className: 'bg-#e8f7f0 text-#1e8e5a' }],
  [3, { label: '已结束', className: 'bg-#f1f2f4 text-#8a8f99' }],
  [4, { label: '已取消', className: 'bg-#fdeaea text-#ff4d4f' }],
])
const statusLabelClass = new Map<string, string>([
  ['待开始', 'bg-#fff4e5 text-#ff9f1a'],
  ['待进入', 'bg-#e7edff text-#3f5fff'],
])

function getStatusMeta(status?: string | number) {
  if (typeof status === 'number')
    return statusMeta.get(status)
  const parsed = Number(status)
  if (!Number.isNaN(parsed))
    return statusMeta.get(parsed)
  if (typeof status === 'string') {
    const className = statusLabelClass.get(status)
    if (className)
      return { label: status, className }
  }
  return null
}

/** ✅ 秒 -> 友好时长文本 */
function formatDuration(sec: any) {
  const s = Math.max(0, Number(sec || 0))
  if (!s)
    return '--'

  const min = Math.round(s / 60)
  if (min < 60)
    return `${min}分钟`

  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}小时${m}分钟` : `${h}小时`
}

/** ✅ 解析 userName：支持 JSON 字符串 / 数组 / 逗号字符串 */
function parseUserName(input: any): string[] {
  if (input === null || input === undefined || input === '')
    return []

  if (Array.isArray(input))
    return input.map((x: any) => String(x)).filter(Boolean)

  if (typeof input === 'string') {
    const str = input.trim()
    if (!str)
      return []

    // JSON 数组字符串
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

    // 普通逗号分隔
    return str.split(/[,，]/).map(s => s.trim()).filter(Boolean)
  }

  return [String(input)].filter(Boolean)
}

function applyMeetingToView(m: MeetingInfoApi) {
  const startSec = Number(m.meeting_start || 0)
  const durSec = Number(m.meeting_duration || 0)

  const start = startSec ? new Date(startSec * 1000) : null
  const end = startSec && durSec ? new Date((startSec + durSec) * 1000) : null

  meetingDetail.title = safeText(m.title)
  meetingDetail.host = safeText(m.createUserName ?? m.admin_userid)
  meetingDetail.meetingNo = safeText(m.meeting_code)
  meetingDetail.location = safeText(m.location)
  meetingDetail.description = safeText(m.description)
  meetingDetail.password = safeText(m.settings?.password)

  const statusRaw = m.status
  const statusStyle = getStatusMeta(statusRaw)
  const statusCode = typeof statusRaw === 'number' ? statusRaw : Number(statusRaw)
  meetingDetail.statusCode = Number.isFinite(statusCode) ? statusCode : undefined
  if (statusStyle) {
    meetingDetail.status = statusStyle.label
    meetingDetail.statusClass = m.statusClass || statusStyle.className
  }
  else {
    meetingDetail.status = statusRaw ? String(statusRaw) : ''
    meetingDetail.statusClass = m.statusClass || ''
  }

  meetingDetail.startTime = start ? formatHM(start) : '--:--'
  meetingDetail.endTime = end ? formatHM(end) : '--:--'
  meetingDetail.date = start ? formatCNDate(start) : '-'

  // ✅ 动态时长
  meetingDetail.durationText = formatDuration(durSec)

  // ✅ userName 处理成 UI 可用数组
  meetingDetail.userName = parseUserName(m.userName)

  const members = m.attendees?.member || []
  meetingDetail.attendees = members.map(i => i.userid).filter(Boolean)
}

async function loadMeetingDetail() {
  if (!meetingId.value)
    return
  loading.value = true
  try {
    const res: any = await getMeetingInfo(meetingId.value)
    const data: MeetingInfoApi = res?.data?.data || res?.data || {}
    applyMeetingToView(data)
  }
  catch (error) {
    console.error('fetch meeting detail failed', error)
    uni.showToast({ title: '获取会议详情失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

onLoad((options) => {
  if (options?.meetingId) {
    meetingId.value = String(options.meetingId)
    pageId.value = String(options.id)
  }

  loadMeetingDetail()
})

onShow(() => {
  const shouldRefresh = uni.getStorageSync(MEETING_DETAIL_REFRESH_KEY)
  if (shouldRefresh) {
    uni.removeStorageSync(MEETING_DETAIL_REFRESH_KEY)
    loadMeetingDetail()
  }
})

function goToEdit() {
  if (!meetingId.value)
    return
  uni.navigateTo({ url: `/pages/meeting/edit?meetingId=${meetingId.value}&id=${pageId.value}` })
}

async function handleCancelMeeting() {
  if (!meetingId.value || canceling.value)
    return

  const ok = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '确认取消会议？',
      content: '取消后参会人将无法加入该会议。',
      confirmText: '取消会议',
      confirmColor: '#E53935',
      success: r => resolve(!!r.confirm),
      fail: () => resolve(false),
    })
  })
  if (!ok)
    return

  canceling.value = true
  try {
    await cancelMeeting(meetingId.value)
    uni.showToast({ title: '已取消会议', icon: 'none' })
    uni.setStorageSync(MEETING_LIST_REFRESH_KEY, true)
    setTimeout(() => {
      uni.navigateBack()
    }, 500)
  }
  catch (error) {
    console.error('cancel meeting failed', error)
    uni.showToast({ title: '取消会议失败', icon: 'none' })
  }
  finally {
    canceling.value = false
  }
}
</script>

<template>
  <view class="min-h-screen bg-#f6f7f9">
    <view class="bg-white px-4 pt-4 fw-600">
      <view class="flex items-center justify-between">
        <view class="flex items-center gap-2">
          <view
            v-if="meetingDetail.status" class="rounded-full px-2 py-0.5 text-3 leading-4"
            :class="meetingDetail.statusClass"
          >
            {{ meetingDetail.status }}
          </view>
          <text class="block text-4 text-#000">
            会议标题：{{ meetingDetail.title }}
          </text>
        </view>
        <wd-loading v-if="loading" size="18px" />
      </view>

      <view class="mt-4 flex items-center justify-between">
        <view class="text-center">
          <text class="block text-5 text-#2f2f2f font-600">
            {{ meetingDetail.startTime }}
          </text>
          <text class="text-2.5 text-#9aa0a6">
            {{ meetingDetail.date }}
          </text>
        </view>

        <view class="time-wrap">
          <view class="duration-wrap gap-3">
            <view class="line" />
            <text class="duration-text">
              {{ meetingDetail.durationText }}
            </text>
            <view class="line" />
          </view>

          <text class="timezone">
            {{ meetingDetail.timezone }}
          </text>
        </view>

        <view class="text-center">
          <text class="block text-5 text-#2f2f2f font-600">
            {{ meetingDetail.endTime }}
          </text>
          <text class="text-3 text-#9aa0a6">
            {{ meetingDetail.date }}
          </text>
        </view>
      </view>
    </view>

    <view class="rounded-4 bg-white">
      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-4 text-#8a8f99">
          发起人
        </text>
        <view class="flex items-center gap-2">
          <text class="text-4 text-#2f2f2f">
            {{ meetingDetail.host }}
          </text>
        </view>
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-2">
        <text class="text-4 text-#8a8f99">
          参会人
        </text>
        <view class="flex items-center gap-2">
          <view class="flex">
            <view
              v-for="(person, index) in meetingDetail.userName" :key="`${person}-${index}`"
              class="h-7 w-7 flex items-center justify-center border-2 border-white rounded-2 bg-#4f7bff text-3 text-white font-700 -ml-1"
            >
              {{ person?.slice(0, 1) }}
            </view>
          </view>
        </view>
      </view>

      <!-- <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          地点
        </text>
        <text class="text-3 text-#2f2f2f">
          {{ meetingDetail.location }}
        </text>
      </view>

      <view class="flex items-center justify-between border-b border-#f0f1f2 px-4 py-4">
        <text class="text-3 text-#8a8f99">
          会议密码
        </text>
        <text class="text-3 text-#2f2f2f">
          {{ meetingDetail.password }}
        </text>
      </view> -->

      <view class="flex items-center justify-between px-4 py-4">
        <text class="text-4 text-#8a8f99">
          会议号
        </text>
        <text class="text-4 text-#2f2f2f">
          {{ meetingDetail.meetingNo }}
        </text>
      </view>
    </view>

    <view class="mx-4 mt-4 rounded-4 bg-white px-4 py-4">
      <text class="text-4 text-#8a8f99">
        会议描述
      </text>
      <text class="mt-2 block text-3 text-#2f2f2f">
        {{ meetingDetail.description }}
      </text>
    </view>

    <view class="mx-4 mt-6 rounded-4 bg-white px-6 py-5 text-center">
      <text class="block text-3 text-#8a8f99">
        {{ meetingDetail.tipTitle }}
      </text>
      <text class="mt-2 block text-2.5 text-#c2c6cc">
        {{ meetingDetail.tipContent }}
      </text>
    </view>

    <view
      v-if="meetingDetail.statusCode === 1"
      class="btn-wrap fixed bottom-0 left-0 right-0 z-10 border-t border-#f0f1f2 bg-white px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
    >
      <wd-button
        custom-class="w-48%" type="error" plain :loading="canceling" :round="false"
        @click="handleCancelMeeting"
      >
        取消会议
      </wd-button>
      <wd-button type="primary" custom-class="w-48%" block :round="false" @click="goToEdit">
        编辑会议
      </wd-button>
    </view>
  </view>
</template>

<style scoped>
.btn-wrap {
  display: flex;
  justify-content: space-between;
}

.time-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
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

.timezone {
  margin-top: 10rpx;
  font-weight: 400;
  font-size: 20rpx;
  color: #333333;
  line-height: 20rpx;
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
</style>
