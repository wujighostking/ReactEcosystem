import { assign, hasChange, isFunction } from 'shared'

export type StateSetup = (set: SetState, get: GetState) => Record<any, any>
type SetState = (setNewState: (state: StoreResult) => StoreResult) => void
type GetState = () => Record<any, any>
type StoreResult = ReturnType<StateSetup>

export function create(stateSetup: StateSetup) {
  return createImpl(stateSetup)
}

function createImpl(stateSetup: StateSetup) {
  let state: StoreResult

  const getState = () => state

  const setState = (setNewState: (state: StoreResult) => StoreResult) => {
    const nextState = setNewState(state)
    const prevState = state

    if (hasChange(nextState, prevState)) {
      state = assign({}, prevState, nextState)
    }
  }

  state = stateSetup(setState, getState)

  function createStore() {
    return {
      ...state,

      getState,
      setState,
    }
  }

  return (get?: (state: StoreResult) => StoreResult) => {
    if (isFunction(get)) {
      return get(state)
    }

    return createStore()
  }
}
