/**
 * validators (uni-app compatible, no i18n)
 * Created by jiachenpan on 16/11/18.
 */

export function isvalidUsername(str) {
  const valid_map = ['admin', 'editor']
  return valid_map.includes(String(str || '').trim())
}

/* 合法 uri */
export function validateURL(textval) {
  const urlregex
    = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d?)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:\d+)*(\/($|[\w.,?'\\+&%$#=~-]+))*$/
  return urlregex.test(String(textval || ''))
}

/**
 * 邮箱
 */
export function isEmail(s) {
  return /^([\w-])+@([\w-])+((.[\w-]{2,3}){1,2})$/.test(
    String(s || ''),
  )
}

/**
 * 手机号码（大陆 11 位）
 */
export function isMobile(s) {
  return /^1\d{10}$/.test(String(s || ''))
}

/**
 * 电话号码
 */
export function isPhone(s) {
  return /^(\d{3,4}-)?\d{7,8}$/.test(String(s || ''))
}

/**
 * URL 地址
 */
export function isURL(s) {
  return /^https?:\/\/.*/.test(String(s || ''))
}

/* 小写字母 */
export function validateLowerCase(str) {
  return /^[a-z]+$/.test(String(str || ''))
}

/* 大写字母 */
export function validateUpperCase(str) {
  return /^[A-Z]+$/.test(String(str || ''))
}

/* 大小写字母 */
export function validatAlphabets(str) {
  return /^[A-Z]+$/i.test(String(str || ''))
}

/**
 * 验证是否为 PC
 * - H5：用 navigator.userAgent
 * - 非 H5：用 uni.getSystemInfoSync().platform 兜底（app/小程序）
 */
export function vaildatePc() {
  // #ifdef H5
  const userAgentInfo = navigator.userAgent || ''
  const Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod']
  let flag = true
  for (let v = 0; v < Agents.length; v++) {
    if (userAgentInfo.includes(Agents[v])) {
      flag = false
      break
    }
  }
  return flag
  // #endif

  // #ifndef H5
  try {
    const sys = uni.getSystemInfoSync()
    // platform: ios | android | devtools | ...
    // 非 devtools 基本都不是 PC
    return sys.platform === 'windows' || sys.platform === 'mac'
  }
  catch (e) {
    return false
  }
  // #endif
}

/**
 * validate email（更宽松）
 */
export function validateEmail(email) {
  const re
    = /^(([^<>()\\[\].,;:\s@"]+(\.[^<>()\\[\].,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\])|(([a-z\-0-9]+\.)+[a-z]{2,}))$/i
  return re.test(String(email || ''))
}

/**
 * 判断身份证号码（18 位）
 * 返回：[hasError(boolean), message(string)]
 * - hasError: true 表示有错误
 * - message: 错误说明；无错误时为空串
 */
export function cardid(code) {
  let list = []
  let hasError = true
  let msg = ''
  const city = {
    11: '北京',
    12: '天津',
    13: '河北',
    14: '山西',
    15: '内蒙古',
    21: '辽宁',
    22: '吉林',
    23: '黑龙江',
    31: '上海',
    32: '江苏',
    33: '浙江',
    34: '安徽',
    35: '福建',
    36: '江西',
    37: '山东',
    41: '河南',
    42: '湖北',
    43: '湖南',
    44: '广东',
    45: '广西',
    46: '海南',
    50: '重庆',
    51: '四川',
    52: '贵州',
    53: '云南',
    54: '西藏',
    61: '陕西',
    62: '甘肃',
    63: '青海',
    64: '宁夏',
    65: '新疆',
    71: '台湾',
    81: '香港',
    82: '澳门',
    91: '国外',
  }

  const raw = String(code || '').trim()

  if (validatenull(raw)) {
    msg = '证件号码不能为空'
    list.push(hasError, msg)
    return list
  }

  if (raw.length !== 18) {
    msg = '证件号码长度不为18位'
    list.push(hasError, msg)
    return list
  }

  if (!/(^\d{18}$)|(^\d{17}([\dX])$)/i.test(raw)) {
    msg = '证件号码格式错误'
    list.push(hasError, msg)
    return list
  }

  if (!city[raw.substr(0, 2)]) {
    msg = '地址编码错误'
    list.push(hasError, msg)
    return list
  }

  // 18 位校验位
  const arr = raw.split('')
  const factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const parity = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'] // 注意：用大写 X

  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += Number(arr[i]) * factor[i]
  }
  const last = parity[sum % 11]
  if (String(arr[17]).toUpperCase() !== last) {
    msg = '证件号码校验位错误'
    list.push(hasError, msg)
    return list
  }

  // 校验通过
  hasError = false
  msg = ''
  list.push(hasError, msg)
  return list
}

/**
 * 判断手机号码是否正确（返回：[hasError, message]）
 */
export function isvalidatemobile(phone) {
  let list = []
  let hasError = true
  let msg = ''
  const raw = String(phone || '').trim()

  if (validatenull(raw)) {
    msg = '手机号码不能为空'
    list.push(hasError, msg)
    return list
  }

  if (raw.length !== 11) {
    msg = '手机号码长度不为11位'
    list.push(hasError, msg)
    return list
  }

  // 你原逻辑里 isPhone 是座机正则，这里改成更符合“手机号”的校验
  if (!/^1[3-9]\d{9}$/.test(raw)) {
    msg = '手机号码格式不正确'
    list.push(hasError, msg)
    return list
  }

  hasError = false
  msg = ''
  list.push(hasError, msg)
  return list
}

/**
 * 判断姓名是否正确（2-4 位中文）
 */
export function validatename(name) {
  const regName = /^[\u4E00-\u9FA5]{2,4}$/
  return regName.test(String(name || '').trim())
}

/**
 * 判断是否为整数 / 数字
 * type=1: 允许小数点（你原实现实际上是“只允许数字和点”）
 * type=2: 只允许数字
 */
export function validatenum(num, type) {
  const s = String(num ?? '')
  let regName = /[^\d.]/g
  if (type === 1) {
    return !regName.test(s)
  }
  else if (type === 2) {
    regName = /\D/g
    return !regName.test(s)
  }
  return true
}

/**
 * 判断是否为小数（你原实现与 validatenum 很接近，保留但修正一致性）
 */
export function validatenumord(num, type) {
  const s = String(num ?? '')
  let regName = /[^\d.]/g
  if (type === 1) {
    return !regName.test(s)
  }
  else if (type === 2) {
    regName = /[^\d.]/g
    return !regName.test(s)
  }
  return true
}

/**
 * 判断是否为空
 */
export function validatenull(val) {
  if (typeof val === 'boolean')
    return false
  if (typeof val === 'number')
    return false

  if (Array.isArray(val)) {
    return val.length === 0
  }
  else if (val && typeof val === 'object') {
    return JSON.stringify(val) === '{}'
  }
  else {
    if (
      val === 'null'
      || val === null
      || val === 'undefined'
      || val === undefined
      || val === ''
    ) {
      return true
    }
    return false
  }
}

/**
 * 判断是否为 json
 */
export function validatejson(val) {
  if (typeof val === 'string') {
    try {
      const obj = JSON.parse(val)
      return obj !== null && typeof obj === 'object'
    }
    catch (e) {
      return false
    }
  }
  return false
}
