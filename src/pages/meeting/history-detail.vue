<script setup lang="ts">
import { getMeetingInfo } from '@/api/meeting'

definePage({
  name: 'meeting-history-detail',
  style: {
    navigationBarTitleText: '历史会议详情',
  },
})

interface MeetingMember { userid: string }
interface MeetingInfoApi {
  title?: string
  meeting_start?: number
  meeting_duration?: number
  admin_userid?: string
  meeting_code?: string
  attendees?: { member?: MeetingMember[] }
}

const meetingId = ref('')
const loading = ref(false)

const historyDetail = reactive({
  title: '-',
  timeRange: '-',
  meetingNo: '-',
  host: '-',
  attendees: [] as string[],
  joinTime: '--',
  duration: '--',
})

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatHM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function formatCNDate(d: Date) {
  return `${d.getFullYear()}年${pad2(d.getMonth() + 1)}月${pad2(d.getDate())}日`
}

function formatMDHM(d: Date) {
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${formatHM(d)}`
}

function formatHMS(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

function applyMeetingToView(m: MeetingInfoApi) {
  const startSec = Number(m.meeting_start || 0)
  const durationSec = Number(m.meeting_duration || 0)
  const start = startSec ? new Date(startSec * 1000) : null
  const end = startSec && durationSec ? new Date((startSec + durationSec) * 1000) : null

  historyDetail.title = m.title || '-'
  historyDetail.meetingNo = m.meeting_code || '-'
  historyDetail.host = m.admin_userid || '-'

  if (start && end) {
    historyDetail.timeRange = `${formatCNDate(start)} ${formatHM(start)}-${formatHM(end)}`
    historyDetail.joinTime = formatMDHM(start)
  }
  else if (start) {
    historyDetail.timeRange = `${formatCNDate(start)} ${formatHM(start)}`
    historyDetail.joinTime = formatMDHM(start)
  }
  else {
    historyDetail.timeRange = '-'
    historyDetail.joinTime = '--'
  }

  historyDetail.duration = durationSec ? formatHMS(durationSec) : '--'

  const members = m.attendees?.member || []
  historyDetail.attendees = members.map(i => i.userid).filter(Boolean)
}

async function loadHistoryDetail() {
  if (!meetingId.value)
    return
  loading.value = true
  try {
    const res: any = await getMeetingInfo(meetingId.value)
    const data: MeetingInfoApi = res?.data?.data || res?.data || {}
    applyMeetingToView(data)
  }
  catch (error) {
    console.error('fetch history detail failed', error)
    uni.showToast({ title: '获取历史会议详情失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

onLoad((options) => {
  if (options?.meetingId)
    meetingId.value = String(options.meetingId)
  loadHistoryDetail()
})
</script>

<template>
  <view class="min-h-screen bg-#f6f7f9">
    <view class="mt-4 bg-white px-4 py-4">
      <view class="flex items-center justify-between">
        <text class="block text-3.5 text-#2f2f2f">
          {{ historyDetail.title }}
        </text>
        <wd-loading v-if="loading" size="18px" />
      </view>
      <text class="mt-2 block text-2.5 text-#9aa0a6">
        {{ historyDetail.timeRange }}
      </text>
      <text class="mt-1 block text-2.5 text-#9aa0a6">
        会议号：{{ historyDetail.meetingNo }}
      </text>

      <view class="mt-4 border-t border-#f0f1f2 pt-4">
        <view class="flex items-center justify-between py-2">
          <text class="text-3 text-#8a8f99">
            发起人
          </text>
          <view class="flex items-center gap-2">
            <view class="h-7 w-7 rounded-2 bg-#d9dce1" />
            <text class="text-3 text-#2f2f2f">
              {{ historyDetail.host }}
            </text>
          </view>
        </view>
        <view class="flex items-center justify-between py-2">
          <text class="text-3 text-#8a8f99">
            参会人
          </text>
          <view class="flex items-center gap-2">
            <view class="flex">
              <view
                v-for="(person, index) in historyDetail.attendees"
                :key="`${person}-${index}`"
                class="h-7 w-7 border-2 border-white rounded-2 bg-#4f7bff -ml-1"
              />
            </view>
            <text class="text-2.5 text-#9aa0a6">
              共{{ historyDetail.attendees.length }}人
            </text>
          </view>
        </view>
      </view>
    </view>
    <view class="meet-time">
      <view class="text-center">
        <text class="time">
          {{ historyDetail.joinTime }}
        </text>
        <text class="desc">
          入会时间
        </text>
      </view>
      <view class="h-6 w-px bg-#f0f1f2" />
      <view class="text-center">
        <text class="time">
          {{ historyDetail.duration }}
        </text>
        <text class="desc">
          入会时长
        </text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.meet-time {
  padding: 32rpx 0;
  margin-top: 24rpx;
  display:flex;
  flex-direction: column;
  justify-content: space-between;
  background: #FFFFFF;
}
.text-center {
  flex: 1;
}
.time {
font-weight: 500;
font-size: 32rpx;
color: #333333;
line-height: 32rpx;
}
.desc {
font-weight: 400;
font-size: 24rpx;
color: #666666;
line-height: 24rpx;
}
</style>
