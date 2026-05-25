const dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
require('dayjs/locale/vi')

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.locale('vi')

const TIMEZONE = 'Asia/Ho_Chi_Minh'

const dates = [
  '2026-05-18T11:34:57.731000Z',
  '2026-05-18T11:35:14.357000Z'
]

console.log('Now (UTC):', dayjs().utc().format())
console.log('Now (TZ):', dayjs().tz(TIMEZONE).format())

for (const d of dates) {
  console.log('\nInput:', d)
  console.log('dayjs(date).fromNow():', dayjs(d).fromNow())
  console.log('dayjs.utc(date).fromNow():', dayjs.utc(d).fromNow())
  console.log('dayjs.utc(date).tz(TIMEZONE).fromNow():', dayjs.utc(d).tz(TIMEZONE).fromNow())
  console.log('formatDateTime:', dayjs.utc(d).tz(TIMEZONE).format('DD/MM/YYYY HH:mm'))
}
