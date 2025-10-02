export function getCurrentTime() {
  return performance.now()
}

export function isFunction(val: any): val is (...args: any[]) => any {
  return typeof val === 'function'
}

export function isNumber(val: any): val is number {
  return typeof val === 'number'
}

export function hasChange(nextState: any, prevState: any) {
  return !Object.is(nextState, prevState)
}

export function isObject(val: any): val is Record<any, any> {
  return val !== null && typeof val === 'object'
}

export function isString(val: any): val is string {
  return typeof val === 'string'
}

export const assign = Object.assign

export const isArray = Array.isArray
