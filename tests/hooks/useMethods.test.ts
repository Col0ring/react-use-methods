import { renderHook, act } from '@testing-library/react-hooks'
import useMethods from '../../packages/hooks/useMethods'

interface State {
  count: number
}
let initialState: State = {
  count: 10,
}

beforeEach(() => {
  initialState = {
    count: 10,
  }
})

describe('hooks useMethods', () => {
  it('should have initialState value as the returned state value', () => {
    const createMethods = (state: State) => ({
      doStuff: () => state,
    })

    const { result } = renderHook(() => useMethods(createMethods, initialState))

    expect(result.current[0]).toEqual(initialState)
  })

  it('should return wrappedMethods object containing all the methods defined in createMethods', () => {
    const createMethods = (state: State) => ({
      reset() {
        return initialState
      },
      increment() {
        return { ...state, count: state.count + 1 }
      },
      decrement() {
        return { ...state, count: state.count - 1 }
      },
    })

    const { result } = renderHook(() => useMethods(createMethods, initialState))
    const keys = Object.keys(createMethods(initialState))
    for (const key of keys) {
      expect(
        result.current[1][key as keyof typeof result.current[1]]
      ).toBeDefined()
    }
  })

  it('should properly update the state based on the createMethods', async () => {
    const count = 10

    const { result } = renderHook(() =>
      useMethods(
        (state) => ({
          reset() {
            return initialState
          },
          midReset() {
            return ({ dispatch }) => {
              dispatch({
                type: 'reset',
              })
            }
          },
          async increment() {
            return { ...state, count: state.count + 1 }
          },
          decrement() {
            return { ...state, count: state.count - 1 }
          },
        }),
        initialState
      )
    )

    await act(async () => {
      result.current[1].increment()
    })

    expect(result.current[0].count).toBe(count + 1)

    act(() => {
      result.current[1].decrement()
    })
    expect(result.current[0].count).toBe(count)

    act(() => {
      result.current[1].decrement()
    })
    expect(result.current[0].count).toBe(count - 1)

    act(() => {
      result.current[1].reset()
    })
    expect(result.current[0].count).toBe(count)

    act(() => {
      result.current[1].increment()
    })
    await act(async () => {
      result.current[1].midReset()
    })
    expect(result.current[0].count).toBe(count)
  })
})
