export type Heap<T extends Node> = Array<T>
export interface Node {
  id: number
  sortIndex: number
}

// !获取堆顶元素
export function peek<T extends Node>(heap: Heap<T>): T | null {
  return heap.length === 0 ? null : heap[0]!
}

// !给堆添加元素
export function push<T extends Node>(heap: Heap<T>, node: T) {
  const index = heap.length
  heap.push(node)
  siftUp(heap, node, index)
}

// !删除堆顶元素
export function pop<T extends Node>(heap: Heap<T>): T | undefined {
  if (heap.length === 0) {
    return undefined
  }

  const first = heap[0]
  const last = heap.pop()!
  if (first !== last) {
    heap[0] = last
    siftDown(heap, last, 0)
  }

  return first
}

function siftUp(heap: Heap<Node>, node: Node, i: number) {
  let index = i

  while (index > 0) {
    const parentIndex = (index - 1) >>> 1
    const parent = heap[parentIndex]!
    if (compare(parent, node) > 0) {
      heap[index] = parent
      heap[parentIndex] = node
      index = parentIndex
    }
    else {
      return
    }
  }
}

function siftDown(heap: Heap<Node>, node: Node, i: number) {
  let index = i
  const length = heap.length
  const halfLength = length >>> 1

  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1
    const left = heap[leftIndex]!
    const rightIndex = leftIndex + 1
    const right = heap[rightIndex]!

    if (compare(left, node) < 0) {
      if (rightIndex < length && compare(right, left) < 0) {
        heap[index] = right
        heap[rightIndex] = node
        index = rightIndex
      }
      else {
        heap[index] = left
        heap[leftIndex] = node
        index = leftIndex
      }
    }
    else if (rightIndex < length && compare(right, node) < 0) {
      heap[index] = right
      heap[rightIndex] = node
      index = rightIndex
    }
    else {
      return
    }
  }
}

function compare(a: Node, b: Node) {
  const diff = a.sortIndex - b.sortIndex
  return diff !== 0 ? diff : a.id - b.id
}
