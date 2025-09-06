export function getCurrentTime() {
  return performance.now()
}

export function isFunction(val: any): val is (...args: any[]) => any {
  return typeof val === 'function'
}
