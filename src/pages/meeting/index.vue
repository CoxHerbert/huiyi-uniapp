<script setup lang="ts">
import { getMeetingList } from '@/api/meeting'

definePage({
  name: 'meeting',
  style: {
    navigationBarTitleText: '会议',
  },
})

interface MeetingItem {
  id: number | string
  status?: string | number
  statusClass?: string
  title: string
  time?: string
  duration?: string
  tip?: string
  creator?: string
  adminUserid?: string
  participants?: string
  location?: string
  meetingNo?: string
}

interface MeetingSection {
  date: string
  items: MeetingItem[]
}

const meetingSections = ref<MeetingSection[]>([
  {
    date: '今天 1月8日',
    items: [
      {
        id: 1,
        status: '待开始',
        statusClass: 'bg-#fff4e5 text-#ff9f1a',
        title: '会议名称超过十二个字就为...',
        time: '下午14:00-15:00',
        duration: '60分钟',
        creator: '张浩',
        adminUserid: 'EW-M1',
        participants: '张浩 张浩 张浩 张浩 张浩 ...等共20人',
        location: '会议室A',
        meetingNo: '668 153 256',
      },
      {
        id: 2,
        status: '待进入',
        statusClass: 'bg-#e7edff text-#3f5fff',
        title: '会议名称超过十二个字就为...',
        time: '下午14:00-15:00',
        duration: '30分钟',
        creator: '张浩',
        adminUserid: 'EW-M2',
        participants: '张浩 张浩 张浩 张浩 张浩 ...等共20人',
        location: '线上会议室',
        meetingNo: '668 153 257',
      },
      {
        id: 3,
        title: '会议名称超过十二个字就为...',
        time: '下午14:00-15:00',
        duration: '45分钟',
        tip: '30分钟后开始',
        creator: '张浩',
        adminUserid: 'EW-M3',
        participants: '张浩 张浩 张浩 张浩 张浩 ...等共20人',
        location: '会议室C',
        meetingNo: '668 153 258',
      },
      {
        id: 4,
        title: '会议名称超过十二个字就为...',
        time: '下午14:00-15:00',
        duration: '20分钟',
        creator: '张浩',
        adminUserid: 'EW-M4',
        participants: '张浩 张浩 张浩 张浩 张浩 ...等共20人',
        location: '会议室B',
        meetingNo: '668 153 259',
      },
    ],
  },
  {
    date: '明天 1月9日',
    items: [
      {
        id: 5,
        title: '会议名称超过十二个字就为...',
        time: '下午14:00-15:00',
        duration: '40分钟',
        creator: '张浩',
        adminUserid: 'EW-M5',
        participants: '张浩 张浩 张浩 张浩 张浩 ...等共20人',
        location: '线上会议室',
        meetingNo: '668 153 260',
      },
    ],
  },
])

const statusMeta = new Map<number, { label: string, className: string }>([
  [1, { label: '已创建', className: 'bg-#e7edff text-#3f5fff' }],
  [2, { label: '进行中', className: 'bg-#e8f7f0 text-#1e8e5a' }],
  [3, { label: '已结束', className: 'bg-#f1f2f4 text-#8a8f99' }],
  [4, { label: '已取消', className: 'bg-#fdeaea text-#ff4d4f' }],
])

function getStatusMeta(status?: string | number) {
  if (typeof status === 'number') {
    return statusMeta.get(status)
  }
  const parsed = Number(status)
  if (Number.isNaN(parsed))
    return null
  return statusMeta.get(parsed)
}

function padTime(value: number) {
  return String(value).padStart(2, '0')
}

function formatDateLabel(value: Date) {
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const dateLabel = `${value.getMonth() + 1}月${value.getDate()}日`
  const valueKey = value.toDateString()
  if (valueKey === today.toDateString())
    return `今天 ${dateLabel}`
  if (valueKey === tomorrow.toDateString())
    return `明天 ${dateLabel}`
  return `${value.getFullYear()}年${dateLabel}`
}

function formatTimeRange(start: number, duration: number) {
  const startDate = new Date(start * 1000)
  const endDate = new Date(startDate.getTime() + duration * 1000)
  const startLabel = `${padTime(startDate.getHours())}:${padTime(startDate.getMinutes())}`
  const endLabel = `${padTime(endDate.getHours())}:${padTime(endDate.getMinutes())}`
  return `${startLabel}-${endLabel}`
}

function parseDate(value?: string) {
  if (!value)
    return null
  const parsed = new Date(value.replace(/-/g, '/'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeMeetingSections(list: any[]): MeetingSection[] {
  if (!Array.isArray(list))
    return []
  if (list.length > 0 && Array.isArray(list[0]?.items)) {
    return list as MeetingSection[]
  }
  const grouped = new Map<string, MeetingItem[]>()
  list.forEach((record) => {
    const startTimestamp = record?.meeting_start ?? record?.meetingStart ?? record?.start_time
    const duration = record?.meeting_duration ?? record?.meetingDuration ?? 0
    const startDate = typeof startTimestamp === 'number'
      ? new Date(startTimestamp * 1000)
      : parseDate(record?.date)
    const dateLabel = startDate ? formatDateLabel(startDate) : '未安排'
    const timeLabel = record?.time
      || record?.timeRange
      || (typeof startTimestamp === 'number' && duration
        ? formatTimeRange(startTimestamp, duration)
        : '')
    const durationLabel = duration ? `${Math.max(Math.round(duration / 60), 1)}分钟` : record?.duration
    const participants = Array.isArray(record?.invitees?.userid)
      ? record.invitees.userid.join(' ')
      : record?.participants
    const item: MeetingItem = {
      id: record?.id ?? record?.meetingId ?? record?.meeting_id ?? `${dateLabel}-${Math.random()}`,
      status: record?.status,
      statusClass: record?.statusClass,
      title: record?.title ?? record?.name ?? '未命名会议',
      time: timeLabel,
      duration: durationLabel,
      tip: record?.tip,
      creator: record?.creator ?? record?.host,
      adminUserid: record?.admin_userid ?? record?.adminUserid,
      participants,
      location: record?.location ?? record?.room,
      meetingNo: record?.meetingNo ?? record?.meeting_no,
    }
    const derivedStatus = getStatusMeta(item.status)
    if (derivedStatus) {
      item.status = derivedStatus.label
      if (!item.statusClass)
        item.statusClass = derivedStatus.className
    }
    if (!grouped.has(dateLabel)) {
      grouped.set(dateLabel, [])
    }
    grouped.get(dateLabel)?.push(item)
  })
  return Array.from(grouped.entries()).map(([date, items]) => ({ date, items }))
}

async function loadMeetingList() {
  try {
    const response = await getMeetingList()
    const list = response?.data?.data?.records || response?.data?.data || []
    if (Array.isArray(list) && list.length > 0) {
      meetingSections.value = normalizeMeetingSections(list)
    }
  }
  catch (error) {
    console.error('fetch meeting list failed', error)
  }
}

onLoad(() => {
  loadMeetingList()
})

function goToCreate() {
  uni.navigateTo({ url: '/pages/meeting/create' })
}

function goToHistory() {
  uni.navigateTo({ url: '/pages/meeting/history' })
}

function goToDetail(meetingId: number) {
  uni.navigateTo({ url: `/pages/meeting/detail?meetingId=${meetingId}` })
}
</script>

<template>
  <view class="min-h-screen bg-#f6f7f9">
    <view class="bg-white px-4 pb-2 pt-3">
      <view class="flex gap-4">
        <view
          class="flex flex-1 flex-col items-center gap-2 rounded-3 bg-#f5f7ff py-3"
          @click="goToCreate"
        >
          <view
            class="h-9 w-9 flex items-center justify-center rounded-3 bg-#e7edff text-#3f5fff"
          >
            <wd-icon name="video" size="18px" />
          </view>
          <text class="text-3 text-#3f5fff">
            预约会议
          </text>
        </view>
        <view
          class="flex flex-1 flex-col items-center gap-2 rounded-3 bg-#f5f7ff py-3"
          @click="goToHistory"
        >
          <view
            class="h-9 w-9 flex items-center justify-center rounded-3 bg-#e7edff text-#3f5fff"
          >
            <wd-icon name="time" size="18px" />
          </view>
          <text class="text-3 text-#3f5fff">
            历史会议
          </text>
        </view>
      </view>
    </view>

    <view class="px-4 pb-4">
      <text class="mb-3 mt-4 block text-4 text-#2f2f2f font-600">
        预约会议列表
      </text>
      <view v-for="section in meetingSections" :key="section.date" class="mb-4">
        <text class="mb-2 block text-3 text-#9aa0a6">
          {{ section.date }}
        </text>
        <view
          v-for="item in section.items"
          :key="item.id"
          class="mb-3 rounded-3 bg-white p-3 shadow-[0_4px_12px_rgba(31,35,41,0.04)]"
          @click="goToDetail(item.id)"
        >
          <view class="flex items-center gap-2">
            <view
              v-if="item.status"
              class="rounded-full px-2 py-0.5 text-2.5 leading-4"
              :class="item.statusClass"
            >
              {{ item.status }}
            </view>
            <text class="flex-1 text-3.5 text-#2f2f2f font-600">
              {{ item.title }}
            </text>
            <wd-icon name="more" size="16px" color="#c2c6cc" />
          </view>
          <view class="mt-2 flex flex-wrap items-center gap-3 text-2.5 text-#5c6066">
            <text v-if="item.time" class="block">
              {{ item.time }}
            </text>
            <text v-if="item.duration" class="block">
              {{ item.duration }}
            </text>
            <text v-if="item.location" class="block">
              {{ item.location }}
            </text>
          </view>
          <text v-if="item.tip" class="mt-1 block text-2.5 text-#ff7a00">
            {{ item.tip }}
          </text>
          <view class="mt-2 text-2.5 text-#9aa0a6 space-y-1">
            <text v-if="item.meetingNo" class="block">
              会议号：{{ item.meetingNo }}
            </text>
            <text class="block">
              创建者：{{ item.creator || item.adminUserid || '-' }}
            </text>
            <text class="block">
              参会人：{{ item.participants || '-' }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
