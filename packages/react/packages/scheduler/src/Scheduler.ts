import type { PriorityLevel } from './SchedulerPriorities'
import { getCurrentTime } from 'shared'

type Callback = (...args: any[]) => Callback | undefined | null

export interface Task {
  id: number
  callback: Callback | null
  priorityLevel: PriorityLevel
  startTime: number
  expirationTime: number
  sortIndex: number
}

// 记录时间切片的起始值，时间戳
let startTime = -1

// 时间切片，这是一个时间段
const frameInterval = 5

export function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime

  // return timeElapsed >= frameInterval

  if (timeElapsed < frameInterval) {
    return false
  }

  return true
}
