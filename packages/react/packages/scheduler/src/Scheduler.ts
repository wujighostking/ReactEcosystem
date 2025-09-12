import type { Heap } from './SchedulerMinHeap'
import type { PriorityLevel } from './SchedulerPriorities'
import { getCurrentTime, isFunction } from 'shared'
import {
  lowPriorityTimeout,
  maxSigned32BitInt,
  normalPriorityTimeout,
  userBlockingPriorityTimeout,
} from './SchedulerFeatureFlags.js'

import { peek, pop, push } from './SchedulerMinHeap'
import { IdlePriority, ImmediatePriority, LowPriority, NoPriority, UserBlockingPriority } from './SchedulerPriorities'

type Callback = (...args: any[]) => Callback | undefined | null | void

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
let startTime = -1

// 时间切片，这是一个时间段
const frameInterval = 5

let taskIdCounter: number = 0

let isHostCallbackScheduled: boolean = false
let isMessageLoopRunning: boolean = false

let isPerformingWork = false

export function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime

  return timeElapsed >= frameInterval
  // if (timeElapsed < frameInterval) {
  //   return false
  // }
  //
  // return true
}

export function workLoop(initialTime: number): boolean {
  const currentTime = initialTime
  currentTask = peek(taskQueue)

  while (currentTask) {
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
        return true
      }
      else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue)
        }
      }
    }
    else {
      pop(taskQueue)
    }

    currentTask = peek(taskQueue)
  }

  return currentTask !== null
  // if (currentTask !== null) {
  //   return true
  // }
  // else {
  //   return false
  // }
}

// 任务调度函数入口
export function scheduleCallback(priorityLevel: PriorityLevel, callback: Callback) {
  const startTime = getCurrentTime()
  let timeout: number

  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = -1
      break
    case UserBlockingPriority:
      timeout = userBlockingPriorityTimeout
      break
    case IdlePriority:
      timeout = maxSigned32BitInt
      break
    case LowPriority:
      timeout = lowPriorityTimeout
      break
    default:
      timeout = normalPriorityTimeout
      break
  }

  const expirationTime = startTime + timeout

  const newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  }

  newTask.sortIndex = expirationTime
  push(taskQueue, newTask)

  if (!isHostCallbackScheduled && !isPerformingWork) {
    isHostCallbackScheduled = true
    requestHostCallback()
  }
}

function requestHostCallback() {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true
    schedulePerformWorkUntilDeadline()
  }
}

function performWorkUntilDeadline() {
  if (isMessageLoopRunning) {
    const currentTime = getCurrentTime()
    startTime = currentTime

    let hasMoreWork = true
    try {
      hasMoreWork = flushWork(currentTime)
    }
    finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline()
      }
      else {
        isMessageLoopRunning = false
      }
    }
  }
}

function flushWork(initialTime: number) {
  isHostCallbackScheduled = false
  isPerformingWork = true

  const previousPriorityLevel = getCurrentPriorityLevel()

  try {
    return workLoop(initialTime)
  }
  finally {
    currentTask = null
    currentPriorityLevel = previousPriorityLevel
    isPerformingWork = false
  }
}

const channel = new MessageChannel()
const port = channel.port2
channel.port1.onmessage = performWorkUntilDeadline
function schedulePerformWorkUntilDeadline() {
  port.postMessage(null)
}

export function getCurrentPriorityLevel() {
  return currentPriorityLevel
}
