<script setup lang="ts">
import { getMeetingList } from '@/api/meeting'
import {
  buildTimeLabel,
  deriveStatus,
  deriveTip,
  formatDateLabel,
  getAmPmLabel,
  getStatusMeta,
  parseDate,
  parseHostUserName,
  parseNameList,
  toMillis,
} from './utils'

definePage({
  name: 'meeting',
  style: {
    navigationBarTitleText: '会议',
    enablePullDownRefresh: false, // ✅ 关键：不用原生下拉
    backgroundColor: '#f6f7f9',
  },
})

interface MeetingItem {
  id: string
  status?: number | string
  statusClass?: string
  title: string
  time?: string
  duration?: string
  tip?: string
  adminUserid?: string
  participants?: string
  location?: string
  meetingNo?: string
  meetingStart?: number
  meetingDuration?: number
  isCreator?: boolean
  userName?: string
  meetingId?: string
  createUserName?: string
  _sortKey?: number
}

interface MeetingSection {
  date: string
  items: MeetingItem[]
}

const meetingSections = ref<MeetingSection[]>([])
const MEETING_LIST_REFRESH_KEY = 'meeting-list-refresh'
const loading = ref(false)

/** ✅ scroll-view 相关：iOS 卡回弹必备 */
const scrollTop = ref(0)
const lastScrollTop = ref(0)
const refresherTriggered = ref(false)

function onScroll(e: any) {
  lastScrollTop.value = Number(e?.detail?.scrollTop || 0)
}

/** scroll-top 必须“发生变化”才会生效 */
function forceScrollToTop() {
  scrollTop.value = lastScrollTop.value || 1
  nextTick(() => {
    scrollTop.value = 0
  })
}

function getRecordSortKey(record: any) {
  const createRaw
    = record?.create_time
      ?? record?.createTime
      ?? record?.created_at
      ?? record?.createdAt
      ?? record?.createAt
      ?? record?.createAtTime
      ?? record?.createdTime
  const createKey = toMillis(createRaw)
  if (createKey)
    return createKey

  const startRaw = record?.meeting_start ?? record?.meetingStart ?? record?.start_time
  return toMillis(startRaw)
}

function normalizeMeetingSections(list: any[]): MeetingSection[] {
  if (!Array.isArray(list))
    return []
  if (list.length > 0 && Array.isArray(list[0]?.items))
    return list as MeetingSection[]

  const grouped = new Map<string, MeetingItem[]>()

  list.forEach((record) => {
    const sortKey = getRecordSortKey(record)

    const startTimestamp = record?.meeting_start ?? record?.meetingStart ?? record?.start_time
    const duration = record?.meeting_duration ?? record?.meetingDuration ?? 0

    const startDate = typeof startTimestamp === 'number'
      ? new Date(startTimestamp * 1000)
      : parseDate(record?.date)

    const dateLabel = startDate ? formatDateLabel(startDate) : '未安排'

    const timeLabel = buildTimeLabel(
      typeof startTimestamp === 'number' ? startTimestamp : undefined,
      typeof duration === 'number' ? duration : undefined,
      record?.time || record?.timeRange,
    )

    const durationLabel = duration ? `${Math.max(Math.round(duration / 60), 1)}分钟` : record?.duration

    const participants = Array.isArray(record?.invitees?.userid)
      ? record.invitees.userid.join(' ')
      : record?.participants

    const userName = parseNameList(record?.userName).join(',')
    const hostUser = parseHostUserName(record?.hostUser)

    const item: MeetingItem = {
      id: record?.id,
      status: deriveStatus(record, typeof startTimestamp === 'number' ? startTimestamp : undefined),
      statusClass: record?.statusClass,
      title: record?.title ?? '未命名会议',
      time: timeLabel,
      duration: durationLabel,
      tip: record?.tip ?? deriveTip(typeof startTimestamp === 'number' ? startTimestamp : undefined),
      createUserName: record?.createUserName,
      adminUserid: record?.adminUserid,
      participants,
      location: record?.location,
      meetingNo: record?.meetingNo,
      meetingStart: typeof startTimestamp === 'number' ? startTimestamp : undefined,
      meetingDuration: typeof duration === 'number' ? duration : undefined,
      isCreator: Boolean(record?.is_creator ?? record?.isCreator ?? record?.role === 'creator'),
      meetingId: record?.meetingId,
      userName,
      hostUser,
      hostUserStr: record.hostUser,
      _sortKey: sortKey,
    }

    const derivedStatus = getStatusMeta(item.status)
    if (derivedStatus) {
      item.status = derivedStatus.label
      item.statusClass = derivedStatus.className
    }

    if (!grouped.has(dateLabel))
      grouped.set(dateLabel, [])
    grouped.get(dateLabel)!.push(item)
  })

  const sections = Array.from(grouped.entries()).map(([date, items]) => {
    const sortedItems = [...items].sort((a, b) => (b._sortKey ?? 0) - (a._sortKey ?? 0))
    const maxKey = sortedItems[0]?._sortKey ?? 0
    return { date, items: sortedItems, _maxKey: maxKey }
  })

  sections.sort((a: any, b: any) => (b._maxKey ?? 0) - (a._maxKey ?? 0))
  return sections.map(({ date, items }) => ({ date, items }))
}

async function loadMeetingList() {
  if (loading.value)
    return
  loading.value = true
  try {
    const response = await getMeetingList({ type: 1 })
    const list = response?.data?.data?.records || response?.data?.data || []
    meetingSections.value = Array.isArray(list) && list.length > 0 ? normalizeMeetingSections(list) : []
  }
  catch (e) {
    console.error('fetch meeting list failed', e)
    meetingSections.value = []
  }
  finally {
    loading.value = false
  }
}

const hasMeetingData = computed(() => {
  if (!Array.isArray(meetingSections.value) || meetingSections.value.length === 0)
    return false
  return meetingSections.value.some(s => Array.isArray(s.items) && s.items.length > 0)
})

onLoad(() => { loadMeetingList() })

onShow(() => {
  // ✅ 返回/切 tab 回来，强制复位到顶部（防止 iOS 残留回弹空白）
  setTimeout(() => forceScrollToTop(), 0)

  const shouldRefresh = uni.getStorageSync(MEETING_LIST_REFRESH_KEY)
  if (shouldRefresh) {
    uni.removeStorageSync(MEETING_LIST_REFRESH_KEY)
    loadMeetingList()
  }
})

async function handleRefresh() {
  if (refresherTriggered.value)
    return
  refresherTriggered.value = true

  try {
    await loadMeetingList()
  }
  finally {
    // ✅ iOS：triggered 直接 false 有时不生效，必须 nextTick + 延迟
    await nextTick()
    setTimeout(() => {
      refresherTriggered.value = false
      forceScrollToTop()
    }, 60)
  }
}

function goToCreate() { uni.navigateTo({ url: '/meeting-sub/create' }) }
function goToHistory() { uni.navigateTo({ url: '/meeting-sub/history' }) }
function goToDetail(meetingId: string, id: string) {
  uni.navigateTo({ url: `/meeting-sub/detail?meetingId=${meetingId}&id=${id}` })
}
function resetRefresher() {
  refresherTriggered.value = false
  forceScrollToTop()
}

function handleRefresherRestore() {
  // 用户松手，回弹结束
  resetRefresher()
}

function handleRefresherAbort() {
  // 系统中断刷新（iOS 很常见）
  resetRefresher()
}
</script>

<template>
  <view class="meeting-page bg-#f6f7f9">
    <scroll-view
      class="meeting-scroll"
      scroll-y
      enhanced
      bounces="false"
      :scroll-top="scrollTop"
      refresher-enabled
      :refresher-triggered="refresherTriggered"
      @scroll="onScroll"
      @refresherrefresh="handleRefresh"
      @refresherrestore="handleRefresherRestore"
      @refresherabort="handleRefresherAbort"
    >
      <view class="meeting-content">
        <!-- 顶部功能区 -->
        <view class="bg-white px-4 pb-2 pt-3">
          <view class="flex gap-4">
            <view class="flex flex-col items-center gap-2 rounded-3 py-3" @click="goToCreate">
              <view class="h-16 w-16 flex items-center justify-center rounded-3 text-#3f5fff">
                <image src="@/static/预约会议.svg" />
              </view>
              <text class="text-3 text-#333333 fw-600">
                预约会议
              </text>
            </view>

            <view class="flex flex-col items-center gap-2 rounded-3 py-3" @click="goToHistory">
              <view class="h-16 w-16 flex items-center justify-center rounded-3 text-#3f5fff">
                <image src="@/static/历史会议.svg" />
              </view>
              <text class="text-3 text-#333333 fw-600">
                历史会议
              </text>
            </view>
          </view>
        </view>

        <!-- 列表区 -->
        <view class="mt-4 bg-white px-4 pb-4 pt-2">
          <text class="mb-3 mt-1 block text-4 text-#2f2f2f font-600">
            未结束的会议
          </text>

          <view v-if="!hasMeetingData" class="flex flex-col items-center justify-center py-14 text-center">
            <image class="h-40 w-40 opacity-80" src="@/static/empty.png" mode="aspectFit" />
            <text class="mt-3 text-3 text-#9aa0a6">
              暂无数据
            </text>
          </view>

          <view v-else>
            <view v-for="section in meetingSections" :key="section.date" class="mb-5">
              <view class="mb-2 flex items-center gap-2 text-3 text-#9aa0a6">
                <image class="h-14px w-14px" src="@/static/日历.svg" />
                <text>{{ section.date }}</text>
              </view>

              <view
                v-for="item in section.items"
                :key="item.id"
                class="meet-card mb-3"
                @click="goToDetail(item.meetingId as any, item.id as any)"
              >
                <!-- 标题行 -->
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

                <!-- 时间 / 提示 -->
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

                <!-- 摘要信息 -->
                <view class="meet-kv">
                  <view class="meet-kv__row">
                    <text class="meet-kv__k">
                      主持人
                    </text>
                    <text class="meet-kv__v meet-kv__v--truncate">
                      {{ item.hostUser || '-' }}
                    </text>
                  </view>
                  <view class="meet-kv__row">
                    <text class="meet-kv__k">
                      参会人
                    </text>
                    <text class="meet-kv__v meet-kv__v--truncate">
                      {{ item.userName || '-' }}
                    </text>
                  </view>

                  <view v-if="item.meetingNo" class="meet-kv__row">
                    <text class="meet-kv__k">
                      会议号
                    </text>
                    <text class="meet-kv__v">
                      {{ item.meetingNo }}
                    </text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
page {
  height: 100%;
  background: #f6f7f9;
}

/* ✅ 用 fixed 锁死容器高度，iOS 不会算错 */
.meeting-page {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  overflow: hidden;
  font-size: 30rpx;
}

.meeting-scroll {
  height: 100%;
}

.meeting-content {
  padding-bottom: 110rpx; /* 给 tabbar 留位置 */
  box-sizing: border-box;
}

/* ------------------ 会议卡片美化 ------------------ */
.meet-card {
  border-radius: 24rpx;
  background: #ffffff;
  padding: 24rpx;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 10rpx 28rpx rgba(15, 23, 42, 0.06);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

/* 按下反馈（H5/APP 通常可见，小程序也不影响） */
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

.status-badge--pending {
  background-color: #fff4e5;
  color: #ff9f1a;
}

.status-badge--ongoing {
  background-color: #e8f7f0;
  color: #1e8e5a;
}

.status-badge--finished,
.status-badge--expired {
  background-color: #f1f2f4;
  color: #8a8f99;
}

.status-badge--canceled {
  background-color: #fdeaea;
  color: #ff4d4f;
}

.status-badge--waiting {
  background-color: #e7edff;
  color: #3f5fff;
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
</style>
