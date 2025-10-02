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

// 从下向上调整
function siftUp(heap: Heap<Node>, node: Node, i: number) {
  let index = i

  while (index > 0) {
    const parentIndex = (index - 1) >>> 1
    const parent = heap[parentIndex]!

    if (compare(parent, node) > 0) {
      heap[parentIndex] = node
      heap[index] = parent
      index = parentIndex

      continue
    }

    return
  }
}

// 从上往下调整
function siftDown(heap: Heap<Node>, node: Node, i: number) {
  const parent = node
  let index = i
  const length = heap.length
  const halfLength = length >>> 1
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1
    const left = heap[leftIndex]!
    const rightIndex = leftIndex + 1
    const right = heap[rightIndex]!

    if (parent && left && compare(parent, left) < 0) {
      // 父节点 < 左节点 ==> 判断父节点和右节点
      if (rightIndex <= length && parent && right && compare(parent, right) < 0) {
        // 父节点 < 右节点
        return
      }
      else {
        // 父节点 > 右节点
        heap[index] = right
        heap[rightIndex] = parent
        index = rightIndex
      }
    }
    else if (rightIndex <= length && right && left && compare(right, left) < 0) {
      // 右节点 < 左节点
      heap[rightIndex] = parent
      heap[index] = right
      index = rightIndex
    }
    else {
      // 右节点 > 左节点
      heap[leftIndex] = parent
      heap[index] = left
      index = leftIndex
    }
  }
}

function compare(a: Node, b: Node) {
  const diff = a.sortIndex - b.sortIndex
  return diff !== 0 ? diff : a.id - b.id
}
