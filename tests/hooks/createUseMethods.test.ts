import { act, renderHook } from '@testing-library/react-hooks'
import thunk from 'redux-thunk'
import { createUseMethods } from '../../packages/index'
import { combineReducers } from '../../packages/reducer-mapper/immer'

describe('hook factory createUseMethods', () => {
  it('should init useMethods hook function', () => {
    const useMethods = createUseMethods()
    expect(useMethods).toBeInstanceOf(Function)
  })
  describe('when using created useMethods hook', () => {
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
      jest.useFakeTimers()
    })

    it('should handle async action with redux thunk', async () => {
      const useMethods = createUseMethods(thunk)
      const { result } = renderHook(() =>
        useMethods(
          (state) => ({
            addAndReset() {
              return ({ dispatch }) => {
                const addAndReset = () => {
                  return (thunkDispatch: typeof dispatch) => {
                    thunkDispatch({ type: 'increment' })

                    setTimeout(() => {
                      thunkDispatch({ type: 'reset' })
                    }, 1000)
                  }
                }

                dispatch(addAndReset())
              }
            },
            reset() {
              return initialState
            },
            increment() {
              return { ...state, count: state.count + 1 }
            },
          }),
          initialState
        )
      )
      await act(async () => {
        result.current[1].addAndReset()
      })
      expect(result.current[0]).toEqual({ count: 11 })
      // fast-forward until all timers have been executed
      act(() => {
        jest.runAllTimers()
      })
      expect(result.current[0]).toEqual({ count: 10 })
    })

    it('should apply useMethods options when the first parameter is an object', async () => {
      const useMethods = createUseMethods(
        {
          reducerMapper: combineReducers,
        },
        thunk
      )
      const { result } = renderHook(() =>
        useMethods(
          (state) => ({
            addAndReset() {
              return ({ dispatch }) => {
                const addAndReset = () => {
                  return (thunkDispatch: typeof dispatch) => {
                    thunkDispatch({ type: 'increment' })

                    setTimeout(() => {
                      thunkDispatch({ type: 'reset' })
                    }, 1000)
                  }
                }

                dispatch(addAndReset())
              }
            },
            reset() {
              return initialState
            },
            increment() {
              state.count += 1
              return state
            },
          }),
          initialState
        )
      )
      act(() => {
        result.current[1].increment()
      })
      expect(result.current[0]).toEqual({ count: 11 })

      await act(async () => {
        result.current[1].addAndReset()
      })
      expect(result.current[0]).toEqual({ count: 12 })
      act(() => {
        jest.runAllTimers()
      })
      expect(result.current[0]).toEqual({ count: 10 })
    })
  })
})
