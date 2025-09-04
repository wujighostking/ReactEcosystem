export type Heap<T extends Node> = Array<T>
export interface Node {
  id: number
  sortIndex: number
}

// !获取堆顶元素
export function peek<T extends Node>(heap: Heap<T>): T | null {
  return heap.length === 0 ? null : heap[0]
}

// !给堆添加元素
export function push() {}

// !删除堆顶元素
export function pop() {}

function compare(a: Node, b: Node) {
  const diff = a.sortIndex - b.sortIndex
  return diff !== 0 ? diff : a.id - b.id
}
