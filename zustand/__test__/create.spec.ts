import { describe, expect, it, vi } from 'vitest'
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

    addAgeFromObject: (age: number) => {
      set({
        age,
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

    const subscriber = () => (newState: any, prevState: any) => {
      expect(newState.age).toBe(prevState.age + 1)
    }
    const addAgeSpy = vi.fn(subscriber)

    const unsubscribe = store.subscribe(addAgeSpy)

    expect(addAgeSpy).not.toHaveBeenCalled()

    store.addAge()
    store.addAge()
    store.addAge()

    // 取消订阅
    unsubscribe()

    expect(addAgeSpy).toHaveBeenCalledTimes(3)

    store.addAge()

    expect(addAgeSpy).not.toHaveBeenCalledTimes(4)
  })

  it('test newState is object', () => {
    const newAge = 10
    const { addAgeFromObject } = store
    addAgeFromObject(newAge)

    expect(store.getState().age).toBe(newAge)
  })
})
