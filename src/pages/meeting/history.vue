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
  title: string // 会议名称
  time?: string
  meetingId?: string

  // ✅ 创建人/创建时间
  createUserName?: string
  createTime?: string // 展示用
  _sortKey?: number // 排序用：毫秒时间戳
}

interface HistorySection {
  date: string
  year: string
  items: HistoryItem[]
}

const historySections = ref<HistorySection[]>([])
const filteredSections = ref<HistorySection[]>([])

const keyword = ref('') // 搜索关键字（仅支持：会议名称 + 发起人）
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

/** ✅ 将各种时间字段统一转成毫秒时间戳（支持：秒/毫秒/字符串时间） */
function toMillis(value: any) {
  if (value === undefined || value === null || value === '')
    return 0

  const n = Number(value)
  if (Number.isFinite(n)) {
    // 秒级时间戳（一般 10 位）→ 转毫秒
    if (n > 0 && n < 1e12)
      return n * 1000
    return n
  }

  if (typeof value === 'string') {
    const d = new Date(value.replace(/-/g, '/'))
    const t = d.getTime()
    return Number.isNaN(t) ? 0 : t
  }

  return 0
}

function formatDateTime(ms: number) {
  if (!ms)
    return ''
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = padTime(d.getMonth() + 1)
  const day = padTime(d.getDate())
  const hh = padTime(d.getHours())
  const mm = padTime(d.getMinutes())
  return `${y}-${m}-${day} ${hh}:${mm}`
}

/** ✅ 排序键：优先创建时间(createTime / create_time)，其次用会议开始时间兜底 */
function getRecordSortKey(record: any) {
  const createRaw
    = record?.createTime
      ?? record?.create_time
      ?? record?.created_at
      ?? record?.createdAt
      ?? record?.createAt
      ?? record?.createAtTime
      ?? record?.createdTime

  const createKey = toMillis(createRaw)
  if (createKey)
    return createKey

  const startRaw
    = record?.meetingStart
      ?? record?.meeting_start
      ?? record?.start_time

  return toMillis(startRaw)
}

function normalizeHistorySections(list: any[]): HistorySection[] {
  if (!Array.isArray(list))
    return []

  const grouped = new Map<string, { date: string, year: string, items: HistoryItem[], _maxKey: number }>()

  list.forEach((record) => {
    const sortKey = getRecordSortKey(record)

    const startTimestamp = record?.meetingStart ?? record?.meeting_start ?? record?.start_time
    const duration = record?.meetingDuration ?? record?.meeting_duration ?? 0

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

    // ✅ 创建时间（展示用）：来自 record.createTime（你指定的字段）
    const createTimeMs = toMillis(record?.createTime)
    const createTimeLabel = createTimeMs ? formatDateTime(createTimeMs) : ''

    const item: HistoryItem = {
      id: record?.id,
      title: record?.title ?? '未命名会议',
      time: timeLabel,
      meetingId: record?.meetingId,

      // ✅ 创建人/创建时间
      createUserName: record?.createUserName || '',
      createTime: createTimeLabel,

      _sortKey: sortKey,
    }

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, { date: dateLabel, year: yearLabel, items: [], _maxKey: 0 })
    }

    const section = grouped.get(dateKey)!
    section.items.push(item)
    section._maxKey = Math.max(section._maxKey, sortKey || 0)
  })

  // ✅ 分组内倒叙 + 分组间倒叙（按创建时间越新越靠前）
  const sections = Array.from(grouped.values())
    .map((section) => {
      const sortedItems = [...section.items].sort((a, b) => (b._sortKey ?? 0) - (a._sortKey ?? 0))
      const maxKey = sortedItems[0]?._sortKey ?? section._maxKey ?? 0
      return { date: section.date, year: section.year, items: sortedItems, _maxKey: maxKey }
    })
    .sort((a: any, b: any) => (b._maxKey ?? 0) - (a._maxKey ?? 0))
    .map(({ date, year, items }) => ({ date, year, items }))

  return sections
}

// ✅ 仅支持：会议名称(title) + 发起人(createUserName)
function applyFilter() {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) {
    filteredSections.value = historySections.value
    return
  }

  const next = historySections.value
    .map((section) => {
      const items = section.items.filter((it) => {
        const title = (it.title || '').toLowerCase()
        const creator = (it.createUserName || '').toLowerCase()
        return title.includes(kw) || creator.includes(kw)
      })
      return { ...section, items }
    })
    .filter(s => s.items.length > 0)

  filteredSections.value = next
}

// ✅ 防抖：输入时降低过滤频率
let filterTimer: any = null
function onKeywordInput(val: string) {
  keyword.value = val
  if (filterTimer)
    clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    applyFilter()
  }, 200)
}

function clearKeyword() {
  keyword.value = ''
  applyFilter()
}

async function loadHistoryList() {
  try {
    const response = await getMeetingList({ type: 2 })
    const list = response?.data?.data?.records || response?.data?.data || []
    historySections.value = normalizeHistorySections(list)
    filteredSections.value = historySections.value
    applyFilter()
  }
  catch (error) {
    console.error('fetch meeting history failed', error)
    historySections.value = []
    filteredSections.value = []
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
  <view class="meeting-page min-h-screen bg-#f6f7f9">
    <!-- ✅ 搜索框（仅：会议名称 + 发起人） -->
    <view class="bg-white">
      <wd-search
        v-model="keyword"
        placeholder="会议名称、发起人"
        :clearable="true"
        :hide-cancel="true"
        @input="onKeywordInput"
        @clear="clearKeyword"
        @search="applyFilter"
        @confirm="applyFilter"
      />
    </view>

    <view>
      <view v-for="section in filteredSections" :key="section.date" class="mb-4">
        <view class="flex items-center justify-between bg-#E0E0E0 px-3 py-1 text-2.5 text-#333333">
          <text>{{ section.date }}</text>
          <text>{{ section.year }}</text>
        </view>

        <view
          v-for="item in section.items"
          :key="item.id"
          class="meet-item"
          @click="goToHistoryDetail(item.meetingId as any)"
        >
          <view class="meet-content">
            <text class="meet-title">
              {{ item.title }}
            </text>

            <view class="meet-time">
              <text>{{ item.time }}</text>

              <!-- ✅ 创建人 -->
              <text v-if="item.createUserName" class="ml-2 text-#999999">
                · {{ item.createUserName }}
              </text>

              <!-- ✅ 创建时间 -->
              <text v-if="item.createTime" class="ml-2 text-#999999">
                · {{ item.createTime }}
              </text>
            </view>
          </view>

          <wd-icon name="arrow-right" size="16px" />
        </view>
      </view>

      <!-- ✅ 无结果 -->
      <view v-if="filteredSections.length === 0" class="py-10 text-center text-2.5 text-#999999">
        暂无匹配的会议
      </view>
    </view>
  </view>
</template>

<style scoped>
.meet-item {
  box-sizing: border-box;
  padding: 32rpx 36rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 144rpx;
  background: #FFFFFF;
  box-shadow: inset 0rpx -1rpx 0rpx 0rpx #E5E5E5;
}

.meet-title {
  font-weight: 600;
  font-size: 32rpx;
  color: #333333;
  line-height: 32rpx;
}

.meet-time {
  margin-top: 18rpx;
  font-weight: 400;
  font-size: 24rpx;
  color: #666666;
  line-height: 24rpx;
}

.meeting-page {
  font-size: 30rpx;
}
</style>
