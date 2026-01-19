<script setup lang="ts">
import { getMeetingList } from '@/api/meeting'
import {
  buildTimeLabel,
  formatDateTime,
  getAmPmLabel,
  getStatusMeta,
  parseHostUserName,
  toMillis,
} from './utils'

definePage({
  name: 'meeting-history',
  style: {
    navigationBarTitleText: '历史会议',
    backgroundColor: '#f6f7f9',
  },
})

interface HistoryItem {
  id: number | string
  status?: number | string
  statusClass?: string

  title: string // 会议名称
  time?: string
  duration?: string
  location?: string
  meetingId?: string

  createUserName?: string
  createTime?: string // 展示用

  meetingStart?: number // 秒
  meetingDuration?: number // 秒

  _sortKey?: number
}

const historyList = ref<HistoryItem[]>([])
const filteredList = ref<HistoryItem[]>([])

const keyword = ref('') // 搜索关键字（仅支持：会议名称 + 发起人）

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

function normalizeHistoryList(list: any[]): HistoryItem[] {
  if (!Array.isArray(list))
    return []

  const items: HistoryItem[] = list.map((record) => {
    const sortKey = getRecordSortKey(record)

    const startTimestamp = record?.meetingStart ?? record?.meeting_start ?? record?.start_time
    const duration = record?.meetingDuration ?? record?.meeting_duration ?? 0

    const timeLabel = buildTimeLabel(
      typeof startTimestamp === 'number' ? startTimestamp : undefined,
      typeof duration === 'number' ? duration : undefined,
      record?.time || record?.timeRange,
    )

    const durationLabel = duration ? `${Math.max(Math.round(duration / 60), 1)}分钟` : record?.duration

    const createTimeMs = toMillis(record?.createTime)
    const createTimeLabel = createTimeMs ? formatDateTime(createTimeMs) : ''
    const hostUser = parseHostUserName(record?.hostUser)
    const item: HistoryItem = {
      id: record?.id,
      status: record?.status,
      statusClass: record?.statusClass,
      title: record?.title ?? '未命名会议',
      time: timeLabel,
      duration: durationLabel,
      location: record?.location || '',
      meetingId: record?.meetingId,

      createUserName: record?.createUserName || '',
      createTime: createTimeLabel,

      meetingStart: typeof startTimestamp === 'number' ? startTimestamp : undefined,
      meetingDuration: typeof duration === 'number' ? duration : undefined,
      hostUser,
      hostUserStr: record.hostUser,
      _sortKey: sortKey,
    }

    const derivedStatus = getStatusMeta(item.status)
    if (derivedStatus) {
      item.status = derivedStatus.label
      if (!item.statusClass)
        item.statusClass = derivedStatus.className
    }

    return item
  })

  // ✅ 整体倒序（越新越靠前）
  return items.sort((a, b) => (b._sortKey ?? 0) - (a._sortKey ?? 0))
}

// ✅ 仅支持：会议名称(title) + 发起人(createUserName)
function applyFilter() {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) {
    filteredList.value = historyList.value
    return
  }

  filteredList.value = historyList.value.filter((it) => {
    const title = (it.title || '').toLowerCase()
    const creator = (it.createUserName || '').toLowerCase()
    return title.includes(kw) || creator.includes(kw)
  })
}

// ✅ 防抖
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
    historyList.value = normalizeHistoryList(list)
    filteredList.value = historyList.value
    applyFilter()
  }
  catch (error) {
    console.error('fetch meeting history failed', error)
    historyList.value = []
    filteredList.value = []
  }
}

onLoad(() => {
  loadHistoryList()
})

function goToHistoryDetail(meetingId: number | string, hostUserStr: string) {
  uni.navigateTo({ url: `/pages/meeting/history-detail?meetingId=${meetingId}&hostUserStr=${hostUserStr}` })
}
</script>

<template>
  <view class="meeting-page bg-#f6f7f9">
    <!-- ✅ 搜索框 -->
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

    <!-- ✅ 列表区：完全复刻 meeting 列表页的容器样式 -->
    <view class="bg-white px-4 pb-4 pt-2">
      <view v-if="filteredList.length === 0" class="flex flex-col items-center justify-center py-14 text-center">
        <image class="h-40 w-40 opacity-80" src="@/static/empty.png" mode="aspectFit" />
        <text class="mt-3 text-3 text-#9aa0a6">
          暂无匹配的会议
        </text>
      </view>

      <view v-else>
        <view
          v-for="item in filteredList"
          :key="item.id"
          class="meet-card mb-3"
          @click="goToHistoryDetail(item.meetingId as any, item.hostUserStr as any)"
        >
          <!-- 标题行（同款：badge + title + arrow） -->
          <view class="meet-card__header">
            <view class="min-w-0 flex flex-1 items-center gap-2">
              <view
                v-if="item.status"
                class="meet-badge"
                :class="item.statusClass"
              >
                {{ item.status }}
              </view>

              <text class="meet-title">
                {{ item.title }}
              </text>
            </view>

            <view class="meet-arrow">
              <van-icon name="arrow" size="16" />
            </view>
          </view>

          <!-- 时间 / 地点（同款布局） -->
          <view class="meet-card__sub">
            <view v-if="item.time" class="meet-time">
              <text class="meet-time__pill">
                {{ getAmPmLabel(item) }}{{ item.time }}
              </text>
              <text v-if="item.duration" class="meet-duration">
                · {{ item.duration }}
              </text>
            </view>

            <view class="meet-localion">
              {{ item.location }}
            </view>
          </view>

          <!-- KV 区（同 meet 页：两行固定结构） -->
          <view class="meet-kv">
            <view class="meet-kv__row">
              <text class="meet-kv__k">
                主持人
              </text>
              <text class="meet-kv__v meet-kv__v--truncate">
                {{ item.createUserName || '-' }}
              </text>
            </view>
            <view class="meet-kv__row">
              <text class="meet-kv__k">
                参会人
              </text>
              <text class="meet-kv__v meet-kv__v--truncate">
                {{ item.createTime || '-' }}
              </text>
            </view>

            <!-- meeting 页这里是 meetingNo；历史页没字段就不展示，但样式/结构已完全对齐 -->
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.meeting-page {
  font-size: 30rpx;
}

/* ✅ 与 meeting 列表页卡片样式一模一样 */
.meet-card {
  border-radius: 24rpx;
  background: #ffffff;
  padding: 24rpx;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 10rpx 28rpx rgba(15, 23, 42, 0.06);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.meet-card:active {
  transform: scale(0.99);
  box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.05);
}

.meet-card__header {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.meet-title {
  min-width: 0;
  flex: 1;
  font-size: 30rpx;
  line-height: 40rpx;
  color: #1f2329;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.meet-arrow {
  color: #c2c6cc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meet-badge {
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  line-height: 28rpx;
  font-weight: 600;
  white-space: nowrap;
}

/* 时间 & 提示 */
.meet-card__sub {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  justify-content: space-between;
}

.meet-time {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
}

.meet-time__pill {
  padding: 8rpx 14rpx;
  border-radius: 14rpx;
  font-size: 26rpx;
  line-height: 28rpx;
  color: #2f2f2f;
  background: #f6f7f9;
}

.meet-duration {
  font-size: 26rpx;
  color: #8a8f99;
}

.meet-tip {
  font-size: 26rpx;
  color: #ff7a00;
  line-height: 34rpx;
}

/* KV 信息区 */
.meet-kv {
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 1px dashed rgba(15, 23, 42, 0.10);
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.meet-kv__row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.meet-kv__k {
  width: 120rpx;
  font-size: 26rpx;
  color: #8a8f99;
  flex-shrink: 0;
}

.meet-kv__v {
  font-size: 26rpx;
  color: #2f2f2f;
  flex: 1;
  min-width: 0;
}

.meet-kv__v--truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.meet-localion {
  font-size: 26rpx;
  color: #8a8f99;
  max-width: 45%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
