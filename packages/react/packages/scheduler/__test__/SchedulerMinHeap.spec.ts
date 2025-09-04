import type { Heap, Node } from '../src/SchedulerMinHeap'
import { describe, expect, it } from 'vitest'
import { peek, pop, push } from '../src/SchedulerMinHeap'

let idCount = 0
function createNode(val: number) {
  return { id: idCount++, sortIndex: val }
}

describe('test min heap', () => {
  it('empty heap return null', () => {
    const tasks: Heap<Node> = []
    expect(peek(tasks)).toBe(null)
  })

  it('heap length === 1', () => {
    const tasks: Heap<Node> = [createNode(1)]
    expect(peek(tasks)?.sortIndex).toBe(1)
  })

  it('heap length > 1', () => {
    const tasks: Heap<Node> = [createNode(1)]
    push(tasks, createNode(2))
    push(tasks, createNode(3))
    expect(peek(tasks)?.sortIndex).toBe(1)
    push(tasks, createNode(0))
    expect(peek(tasks)?.sortIndex).toBe(0)
    pop(tasks)
    expect(peek(tasks)?.sortIndex).toBe(1)
  })
})
