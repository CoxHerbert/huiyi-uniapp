<script setup lang="ts">
import { getMeetingList } from '@/api/meeting'

definePage({
  name: 'meeting-history',
  style: {
    navigationBarTitleText: '历史会议',
  },
})

interface HistoryItem {
  id: number | string
  title: string
  time?: string
  meetingNo?: string
  meetingId?: string
}

interface HistorySection {
  date: string
  year: string
  items: HistoryItem[]
}

const historySections = ref<HistorySection[]>([])

const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function padTime(value: number) {
  return String(value).padStart(2, '0')
}

function formatDateLabel(value: Date) {
  const weekLabel = weekdayLabels[value.getDay()] || ''
  return `${value.getMonth() + 1}月${value.getDate()}日 ${weekLabel}`
}

function formatYearLabel(value: Date) {
  return `${value.getFullYear()}年`
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

function buildTimeLabel(startTimestamp?: number, durationSeconds?: number, fallback?: string) {
  if (typeof startTimestamp === 'number' && typeof durationSeconds === 'number') {
    return formatTimeRange(startTimestamp, durationSeconds)
  }
  return fallback || ''
}

function normalizeHistorySections(list: any[]): HistorySection[] {
  if (!Array.isArray(list))
    return []
  const grouped = new Map<string, HistorySection>()
  list.forEach((record) => {
    const startTimestamp = record?.meetingStart
    const duration = record?.meetingDuration ?? 0
    const startDate = typeof startTimestamp === 'number'
      ? new Date(startTimestamp * 1000)
      : parseDate(record?.date)
    const dateKey = startDate ? startDate.toDateString() : 'unknown'
    const dateLabel = startDate ? formatDateLabel(startDate) : '未安排'
    const yearLabel = startDate ? formatYearLabel(startDate) : ''
    const timeLabel = buildTimeLabel(
      typeof startTimestamp === 'number' ? startTimestamp : undefined,
      typeof duration === 'number' ? duration : undefined,
      record?.time || record?.timeRange,
    )
    const item: HistoryItem = {
      id: record?.id,
      title: record?.title ?? '未命名会议',
      time: timeLabel,
      meetingNo: record?.meeting_code,
      meetingId: record?.meetingId,
    }
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, { date: dateLabel, year: yearLabel, items: [] })
    }
    grouped.get(dateKey)?.items.push(item)
  })
  return Array.from(grouped.values())
}

async function loadHistoryList() {
  try {
    const response = await getMeetingList({ type: 2 })
    const list = response?.data?.data?.records || response?.data?.data || []
    historySections.value = normalizeHistorySections(list)
  }
  catch (error) {
    console.error('fetch meeting history failed', error)
    historySections.value = []
  }
}

onLoad(() => {
  loadHistoryList()
})

function goToHistoryDetail(meetingId: number | string) {
  uni.navigateTo({ url: `/pages/meeting/history-detail?meetingId=${meetingId}` })
}
</script>

<template>
  <view class="min-h-screen bg-#f6f7f9">
    <view class="mt-3 bg-white px-3 py-2">
      <view class="flex items-center gap-2 rounded-3 bg-#f3f4f6 px-3 py-2">
        <wd-icon name="search" size="16px" color="#9aa0a6" />
        <text class="text-2.5 text-#9aa0a6">
          会议名称、会议号、发起人
        </text>
      </view>
    </view>

    <view class="mt-4">
      <view v-for="section in historySections" :key="section.date" class="mb-4">
        <view class="flex items-center justify-between text-2.5 text-#9aa0a6">
          <text>{{ section.date }}</text>
          <text>{{ section.year }}</text>
        </view>
        <view
          v-for="item in section.items"
          :key="item.id"
          class="mt-3 bg-white px-4 py-3"
          @click="goToHistoryDetail(item.meetingId)"
        >
          <text class="block text-3.5 text-#2f2f2f">
            {{ item.title }}
          </text>
          <view class="mt-2 flex items-center justify-between text-2.5 text-#9aa0a6">
            <text>{{ item.time }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
