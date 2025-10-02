import { assign, hasChange, isFunction } from 'shared'

export type StateSetup<T = Record<any, any>> = (set: SetState, get: GetState) => T
type SetState = (newState: StoreResult | ((state: StoreResult) => StoreResult)) => void
type GetState = () => Record<any, any>
type StoreResult = ReturnType<StateSetup>
type Subscriber = (newState: StoreResult, prevState: StoreResult) => void

export function create(stateSetup: StateSetup) {
  return createImpl(stateSetup)
}

function createImpl(stateSetup: StateSetup) {
  let state: StoreResult

  const listeners: Set<Subscriber> = new Set()

  const getState = () => state

  const setState = (newState: StoreResult | ((state: StoreResult) => StoreResult)) => {
    const nextState = isFunction(newState) ? newState(state) : newState
    const prevState = state

    if (hasChange(nextState, prevState)) {
      state = assign({}, prevState, nextState)

      listeners.forEach(listener => listener(state, prevState))
    }
  }

  state = stateSetup(setState, getState)

  function subscribe(subscriber: Subscriber) {
    listeners.add(subscriber)

    return () => {
      listeners.delete(subscriber)
    }
  }

  function createStore() {
    return {
      ...state,

      getState,
      setState,
      subscribe,
    }
  }

  return (get?: (state: StoreResult) => StoreResult): StoreResult => {
    if (isFunction(get)) {
      return get(state)
    }

    return createStore()
  }
}
