import type { Heap } from './SchedulerMinHeap'
import type { PriorityLevel } from './SchedulerPriorities'
import { getCurrentTime, isFunction } from 'shared'
import { isNumber } from 'shared/src'

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

// 没有延迟的任务
const taskQueue: Heap<Task> = []
// 有延迟的任务
const timerQueue: Heap<Task> = []

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

// 是否正在倒计时
let isHostTimeoutScheduled = false

let taskTimeoutID: NodeJS.Timeout | undefined

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
  let currentTime = initialTime
  advanceTimers(currentTime)
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
      currentTime = getCurrentTime()

      if (isFunction(continuationCallback)) {
        currentTask.callback = continuationCallback
        advanceTimers(currentTime)
        return true
      }
      else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue)
        }

        advanceTimers(currentTime)
      }
    }
    else {
      pop(taskQueue)
    }

    currentTask = peek(taskQueue)
  }

  if (currentTask !== null) {
    return true
  }
  else {
    const firstTimer = peek(timerQueue)
    if (firstTimer !== null) {
      requesthostTimeout(handleTimeout, firstTimer.startTime - currentTime)
    }

    return false
  }
}

// 任务调度函数入口
export function scheduleCallback(priorityLevel: PriorityLevel, callback: Callback, options?: { delay: number }) {
  const currentTime = getCurrentTime()
  let startTime: number

  if (options) {
    const delay = options.delay

    if (isNumber(delay) && delay > 0) {
      startTime = currentTime + delay
    }
    else {
      startTime = currentTime
    }
  }
  else {
    startTime = currentTime
  }

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

  if (startTime > currentTime) {
    // newTask 任务有延迟
    // 开始时间作为排序指标，哪个任务最先到达开始时间，哪个任务就推入到 taskQueue 中
    newTask.sortIndex = startTime
    // 任务在 timerQueue 到达开始时间之后，就会被推入 taskQueue
    push(timerQueue, newTask)
    // 每次只倒计时一个任务
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      if (isHostTimeoutScheduled) {
        cancelhostTimeout()
      }
      else {
        isHostTimeoutScheduled = true
      }

      requesthostTimeout(handleTimeout, startTime - currentTime)
    }
  }
  else {
    newTask.sortIndex = expirationTime
    push(taskQueue, newTask)

    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true
      requestHostCallback()
    }
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

function requesthostTimeout(
  callback: (currentTime: number) => void,
  ms: number,
) {
  taskTimeoutID = setTimeout(() => {
    callback(getCurrentTime())
  }, ms)
}

function cancelhostTimeout() {
  clearTimeout(taskTimeoutID)
  taskTimeoutID = undefined
}

function handleTimeout(currentTime: number) {
  isHostTimeoutScheduled = false
  // 把延迟任务从 timerQueue 中推入到 taskQueue 中
  advanceTimers(currentTime)

  // 主线程当前没有调度任务，处于空闲状态
  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true
      requestHostCallback()
    }
    else {
      const firstTimer = peek(timerQueue)
      if (firstTimer !== null) {
        requesthostTimeout(handleTimeout, firstTimer.startTime - currentTime)
      }
    }
  }
}

function advanceTimers(currentTime: number) {
  let timer = peek(timerQueue)

  while (timer !== null) {
    if (timer.callback === null) {
      pop(timerQueue)
    }
    else if (timer.startTime <= currentTime) {
      // 有效的任务：任务已经到达开始时间，可以推入 taskQueue
      pop(timerQueue)
      timer.sortIndex = timer.expirationTime
      push(taskQueue, timer)
    }
    else {
      return
    }

    timer = peek(timerQueue)
  }
}
