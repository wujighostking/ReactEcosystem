import { describe, expect, it } from 'vitest'
import {
  IdlePriority,
  ImmediatePriority,
  LowPriority,
  NoPriority,
  NormalPriority,
  scheduleCallback,
  UserBlockingPriority,
} from '../src'

describe('test scheduler', () => {
  it('空任务', () => {
    const tasks: string[] = []

    scheduleCallback(ImmediatePriority, () => {
      expect(tasks).toEqual([])
    })
  })

  it('一个任务', () => {
    const tasks: string[] = []

    scheduleCallback(NoPriority, () => {
      tasks.push('task1')

      expect(tasks).toEqual(['task1'])
    })
  })

  it('两个同优先级任务', () => {
    const tasks: string[] = []

    scheduleCallback(NormalPriority, () => {
      tasks.push('task1')

      expect(tasks).toEqual(['task1'])
    })

    scheduleCallback(NormalPriority, () => {
      tasks.push('task2')

      expect(tasks).toEqual(['task1', 'task2'])
    })
  })

  it('两个不同优先级任务', () => {
    const tasks: string[] = []

    scheduleCallback(UserBlockingPriority, () => {
      tasks.push('task1')

      expect(tasks).toEqual(['task2', 'task1'])
    })

    scheduleCallback(ImmediatePriority, () => {
      tasks.push('task2')

      expect(tasks).toEqual(['task2'])
    })
  })

  it('四个不同优先级任务', () => {
    const tasks: string[] = []

    scheduleCallback(LowPriority, () => {
      tasks.push('task1')

      expect(tasks).toEqual(['task3', 'task2', 'task1'])
    })

    scheduleCallback(UserBlockingPriority, () => {
      tasks.push('task2')

      expect(tasks).toEqual(['task3', 'task2'])
    })

    scheduleCallback(ImmediatePriority, () => {
      tasks.push('task3')

      expect(tasks).toEqual(['task3'])
    })

    scheduleCallback(IdlePriority, () => {
      tasks.push('task4')

      expect(tasks).toEqual(['task3', 'task2', 'task1', 'task4'])
    })
  })
})
