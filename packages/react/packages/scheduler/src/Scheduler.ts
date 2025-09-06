import type { Heap } from './SchedulerMinHeap'
import type { PriorityLevel } from './SchedulerPriorities'
import { getCurrentTime, isFunction } from 'shared'
import { peek, pop } from './SchedulerMinHeap'
import { NoPriority } from './SchedulerPriorities'

type Callback = (...args: any[]) => Callback | undefined | null

export interface Task {
  id: number
  callback: Callback | null
  priorityLevel: PriorityLevel
  startTime: number
  expirationTime: number
  sortIndex: number
}
const taskQueue: Heap<Task> = []

// 当前正在执行的任务
let currentTask: Task | null = null

let currentPriorityLevel: PriorityLevel = NoPriority

// 记录时间切片的起始值，时间戳
// eslint-disable-next-line prefer-const
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

export function workLoop(initialTime: number) {
  const currentTime = initialTime
  currentTask = peek(taskQueue)

  // eslint-disable-next-line no-unmodified-loop-condition
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break
    }
    const callback = currentTask.callback

    if (isFunction(callback)) {
      currentTask.callback = null
      currentPriorityLevel = currentTask.priorityLevel
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime
      const continuationCallback = callback(didUserCallbackTimeout)

      if (isFunction(continuationCallback)) {
        currentTask.callback = continuationCallback
      }
    }
    else {
      pop(taskQueue)
    }
  }
}

export function getCurrentPriorityLevel() {
  return currentPriorityLevel
}
