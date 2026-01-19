export type StatusMeta = { label: string, className: string }

const statusMeta = new Map<number, StatusMeta>([
  [1, { label: '待开始', className: 'status-badge--pending' }],
  [2, { label: '会议中', className: 'status-badge--ongoing' }],
  [3, { label: '已结束', className: 'status-badge--finished' }],
  [4, { label: '已取消', className: 'status-badge--canceled' }],
  [5, { label: '已过期', className: 'status-badge--expired' }],
])

const statusLabelClass = new Map<string, string>([
  ['待开始', 'status-badge--pending'],
  ['待进入', 'status-badge--waiting'],
])

export function getStatusMeta(status?: string | number): StatusMeta | null {
  if (typeof status === 'number')
    return statusMeta.get(status) ?? null
  const parsed = Number(status)
  if (!Number.isNaN(parsed))
    return statusMeta.get(parsed) ?? null
  if (typeof status === 'string') {
    const className = statusLabelClass.get(status)
    if (className)
      return { label: status, className }
  }
  return null
}

export function padTime(value: number) {
  return String(value).padStart(2, '0')
}

export function formatTimeRange(start: number, duration: number) {
  const startDate = new Date(start * 1000)
  const endDate = new Date(startDate.getTime() + duration * 1000)
  const startLabel = `${padTime(startDate.getHours())}:${padTime(startDate.getMinutes())}`
  const endLabel = `${padTime(endDate.getHours())}:${padTime(endDate.getMinutes())}`
  return `${startLabel}-${endLabel}`
}

export function buildTimeLabel(startTimestamp?: number, durationSeconds?: number, fallback?: string) {
  if (typeof startTimestamp === 'number' && typeof durationSeconds === 'number') {
    return formatTimeRange(startTimestamp, durationSeconds)
  }
  return fallback || ''
}

export function getAmPmLabel(item: { meetingStart?: number, time?: string }) {
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

/** ✅ 将各种时间字段统一转成毫秒时间戳（支持：秒/毫秒/字符串时间） */
export function toMillis(value: any) {
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

export function formatDateTime(ms: number) {
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

export function formatDateLabel(value: Date) {
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

export function parseDate(value?: string) {
  if (!value)
    return null
  const parsed = new Date(value.replace(/-/g, '/'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function deriveTip(startTimestamp?: number) {
  if (typeof startTimestamp !== 'number')
    return null
  const nowSeconds = Math.floor(Date.now() / 1000)
  const diffSeconds = startTimestamp - nowSeconds
  if (diffSeconds > 0 && diffSeconds <= 30 * 60)
    return '30分钟后开始'
  return null
}

export function deriveStatus(record: any, startTimestamp?: number) {
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

/** ✅ 秒 -> 友好时长文本 */
export function formatDuration(sec: any) {
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
export function parseNameList(input: any): string[] {
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
      catch {
        // ignore
      }
    }

    return str.split(/[,，]/).map(s => s.trim()).filter(Boolean)
  }

  return [String(input)].filter(Boolean)
}

export function parseHostUserName(input: any) {
  if (input === null || input === undefined || input === '')
    return ''

  if (Array.isArray(input))
    return input.map((item: any) => item?.realName ?? item?.name ?? item).filter(Boolean).join(',')

  if (typeof input === 'string') {
    const str = input.trim()
    if (!str)
      return ''
    if (str.startsWith('[')) {
      try {
        const arr = JSON.parse(str)
        if (Array.isArray(arr))
          return arr.map((item: any) => item?.realName ?? item?.name ?? item).filter(Boolean).join(',')
      }
      catch {
        return ''
      }
    }
  }

  return ''
}

export function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function formatHM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function formatCNDate(d: Date) {
  return `${d.getFullYear()}年${pad2(d.getMonth() + 1)}月${pad2(d.getDate())}日`
}

export function safeText(v: any, fallback = '-') {
  return v === null || v === undefined || v === '' ? fallback : String(v)
}
