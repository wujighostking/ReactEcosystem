import { describe, expect, it } from 'vitest'
import { create } from '../src'

describe('test zustand', () => {
  const useStore = create(set => ({
    age: 0,
    addAge: () => {
      set((state) => {
        return {
          age: state.age + 1,
        }
      })
    },

    minusAge: () => {
      set((state) => {
        return {
          age: state.age - 1,
        }
      })
    },
  }))

  const store = useStore()

  it('test store', () => {
    expect(store).toEqual({
      ...store,
    })
  })

  it('create store property', () => {
    expect(store.getState().age).toBe(0)
  })

  it('create store method', () => {
    const { addAge } = store.getState()
    addAge()

    expect(store.getState().age).toBe(1)
  })

  it('test zustand create callback', () => {
    const age = useStore(state => state.age)

    expect(age).toBe(1)
  })

  it('test zustand set merge function', () => {
    const { minusAge } = store.getState()
    minusAge()

    expect(store.getState().age).toBe(0)
  })

  it('test subscriber', () => {
    const store = useStore()

    store.subscribe((newState: any, prevState: any) => {
      expect(newState.age).toBe(prevState.age + 1)
    })

    store.addAge()
    store.addAge()
    store.addAge()
  })
})
