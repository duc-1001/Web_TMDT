import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import "dayjs/locale/vi"

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.locale("vi")

const TIMEZONE = "Asia/Ho_Chi_Minh"

/**
 * Format: 12/03/2026 14:25
 */
export function formatDateTime(date?: string | Date) {
  if (!date) return "-"
  return dayjs.utc(date).tz(TIMEZONE).format("DD/MM/YYYY HH:mm")
}

/**
 * Format: 12/03/2026
 */
export function formatDate(date?: string | Date) {
  if (!date) return "-"
  return dayjs.utc(date).tz(TIMEZONE).format("DD/MM/YYYY")
}

/**
 * Format: 14:25
 */
export function formatTime(date?: string | Date) {
  if (!date) return "-"
  return dayjs.utc(date).tz(TIMEZONE).format("HH:mm")
}

/**
 * Format: 5 phút trước, 2 giờ trước
 */
export function formatTimeAgo(date?: string | Date) {
  if (!date) return "-"
  return dayjs.utc(date).tz(TIMEZONE).fromNow()
}

/**
 * Kiểm tra ngày có phải hôm nay
 */
export function isToday(date?: string | Date) {
  if (!date) return false
  return dayjs.utc(date).tz(TIMEZONE).isSame(dayjs().tz(TIMEZONE), "day")
}

/**
 * Kiểm tra ngày có phải hôm qua
 */
export function isYesterday(date?: string | Date) {
  if (!date) return false
  return dayjs.utc(date).tz(TIMEZONE).isSame(
    dayjs().tz(TIMEZONE).subtract(1, "day"),
    "day"
  )
}

/**
 * Format smart: Hôm nay / Hôm qua / ngày thường
 */
export function formatSmartDate(date?: string | Date) {
  if (!date) return "-"

  const d = dayjs.utc(date).tz(TIMEZONE)

  if (d.isSame(dayjs().tz(TIMEZONE), "day")) {
    return `Hôm nay ${d.format("HH:mm")}`
  }

  if (d.isSame(dayjs().tz(TIMEZONE).subtract(1, "day"), "day")) {
    return `Hôm qua ${d.format("HH:mm")}`
  }

  return d.format("DD/MM/YYYY HH:mm")
}

/**
 * Tính số ngày còn lại đến một ngày nào đó
 * Trả về số ngày, hoặc null nếu ngày không hợp lệ
 */

export function getDaysUntil(date?: string | Date) {
  if (!date) return null

  const now = dayjs().tz(TIMEZONE).startOf("day")
  const target = dayjs.utc(date).tz(TIMEZONE).startOf("day")

  return target.diff(now, "day")
}