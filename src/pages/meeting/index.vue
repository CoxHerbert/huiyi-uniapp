<script setup lang="ts">
import { getMeetingList } from '@/api/meeting'

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

const statusMeta = new Map<number, { label: string, className: string }>([
  [1, { label: '待开始', className: 'bg-#fff4e5 text-#ff9f1a' }],
  [2, { label: '会议中', className: 'bg-#e8f7f0 text-#1e8e5a' }],
  [3, { label: '已结束', className: 'bg-#f1f2f4 text-#8a8f99' }],
  [4, { label: '已取消', className: 'bg-#fdeaea text-#ff4d4f' }],
  [5, { label: '已过期', className: 'bg-#f1f2f4 text-#8a8f99' }],
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

function padTime(value: number) {
  return String(value).padStart(2, '0')
}

function formatDateLabel(value: Date) {
  const today = new Date()
  const dayAfterTomorrow = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  dayAfterTomorrow.setDate(today.getDate() + 2)

  const dateLabel = `${value.getMonth() + 1}月${value.getDate()}日`
  const valueKey = value.toDateString()
  if (valueKey === today.toDateString())
    return `今天 ${dateLabel}`
  if (valueKey === tomorrow.toDateString())
    return `明天 ${dateLabel}`
  if (valueKey === dayAfterTomorrow.toDateString())
    return `后天 ${dateLabel}`
  return dateLabel
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

function deriveTip(startTimestamp?: number) {
  if (typeof startTimestamp !== 'number')
    return null
  const nowSeconds = Math.floor(Date.now() / 1000)
  const diffSeconds = startTimestamp - nowSeconds
  if (diffSeconds > 0 && diffSeconds <= 30 * 60)
    return '30分钟后开始'
  return null
}

function deriveStatus(record: any, startTimestamp?: number) {
  if (record?.status !== undefined && record?.status !== null)
    return record.status
  if (typeof startTimestamp !== 'number')
    return null
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (startTimestamp > nowSeconds)
    return null
  const isCreator = Boolean(record?.is_creator ?? record?.isCreator ?? record?.role === 'creator')
  return isCreator ? '待开始' : '待进入'
}

function getAmPmLabel(item: MeetingItem) {
  const ts = item.meetingStart
  if (typeof ts === 'number') {
    const d = new Date(ts * 1000)
    return d.getHours() >= 12 ? '下午' : '上午'
  }
  const start = item.time?.split('-')?.[0]?.trim()
  if (start) {
    const hour = Number(start.split(':')?.[0])
    if (!Number.isNaN(hour))
      return hour >= 12 ? '下午' : '上午'
  }
  return ''
}

function toMillis(value: any) {
  if (value === undefined || value === null || value === '')
    return 0
  const n = Number(value)
  if (Number.isFinite(n)) {
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

    const userName = record?.userName
      ? (() => {
          try {
            const arr = JSON.parse(record.userName)
            return Array.isArray(arr) ? arr.join(',') : ''
          }
          catch { return '' }
        })()
      : ''

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
      _sortKey: sortKey,
    }

    const derivedStatus = getStatusMeta(item.status)
    if (derivedStatus) {
      item.status = derivedStatus.label
      if (!item.statusClass)
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

function goToCreate() { uni.navigateTo({ url: '/pages/meeting/create' }) }
function goToHistory() { uni.navigateTo({ url: '/pages/meeting/history' }) }
function goToDetail(meetingId: string, id: string) {
  uni.navigateTo({ url: `/pages/meeting/detail?meetingId=${meetingId}&id=${id}` })
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

        <view class="mt-4 bg-white px-4 pb-4 pt-2">
          <text class="mb-3 mt-4 block text-4 text-#2f2f2f font-600">
            预约会议列表
          </text>

          <view v-if="!hasMeetingData" class="flex flex-col items-center justify-center py-14 text-center">
            <image class="h-40 w-40 opacity-80" src="@/static/empty.png" mode="aspectFit" />
            <text class="mt-3 text-3 text-#9aa0a6">
              暂无数据
            </text>
          </view>

          <view v-else>
            <view v-for="section in meetingSections" :key="section.date" class="mb-4">
              <view class="mb-2 flex items-center gap-2 text-3 text-#9aa0a6">
                <image class="h-14px w-14px" src="@/static/日历.svg" />
                <text>{{ section.date }}</text>
              </view>

              <view
                v-for="item in section.items" :key="item.id" class="meet-item mb-3 rounded-4 bg-white py-3"
                @click="goToDetail(item.meetingId as any, item.id as any)"
              >
                <view>
                  <view class="flex items-center gap-2">
                    <view
                      v-if="item.status" class="rounded-full px-2 py-0.5 text-3 leading-4"
                      :class="item.statusClass"
                    >
                      {{ item.status }}
                    </view>

                    <text class="min-w-0 flex-1 truncate text-3.5 text-#2f2f2f font-600">
                      {{ item.title }}
                    </text>

                    <view class="flex items-center text-#c2c6cc">
                      <van-icon name="arrow" size="16" />
                    </view>
                  </view>

                  <text v-if="item.tip" class="mt-1 block text-3 text-#ff7a00">
                    {{ item.tip }}
                  </text>

                  <view class="mt-2 flex flex-wrap items-center gap-3 text-3 text-#333333">
                    <text v-if="item.time" class="block">
                      {{ getAmPmLabel(item) }}{{ item.time }}
                    </text>
                  </view>

                  <view class="mt-2 text-3 text-#9aa0a6 space-y-1">
                    <text v-if="item.meetingNo" class="block">
                      会议号：{{ item.meetingNo }}
                    </text>
                    <text class="block">
                      创建者：{{ item.createUserName || '-' }}
                    </text>
                    <text class="block">
                      参会人：{{ item.userName || '-' }}
                    </text>
                  </view>
                </view>

                <wd-icon name="arrow-right" size="22px" />
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
</style>
