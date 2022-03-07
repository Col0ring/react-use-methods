import { createMethodsContext, createUseMethods } from '@packages/index'
// make sure immer has been installed
import { combineReducers } from '@packages/reducer-mapper/immer'

import thunk from 'redux-thunk'

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
const useMethods = createUseMethods(thunk)

export interface MethodsState {
  count: number
}

const [useCountContext, CounterProvider, , withCountProvider] =
  createMethodsContext(
    (state) => {
      return {
        methods: {
          increment() {
            state.count += 1
            console.log(state)
            // 这里可以不导出也不会报错，但是 ts 会报错
            return state
          },
          incrementDouble() {
            // state.count *= 2
            return { ...state, count: state.count * 2 }
          },
          decrement() {
            state.count -= 1
            return state
          },
          set(current: number) {
            // 直接返回
            return { ...state, count: current }
          },
          reset() {
            return { ...state, count: 0 }
          },
        },
        actions: {
          midReset() {
            return async ({ dispatch, payload }) => {
              // 可在这里使用诸如 redux-thunk 这样的中间件
              dispatch({
                type: 'addAndReset',
              })
            }
          },
          addAndReset() {
            return async ({ dispatch }) => {
              const addAndReset = () => {
                return async (thunkDispatch: typeof dispatch) => {
                  thunkDispatch({ type: 'increment' })
                  setTimeout(() => {
                    thunkDispatch({ type: 'reset' })
                  }, 1000)
                }
              }
              dispatch(addAndReset())
            }
          },
        },
      }
    },
    {
      count: 0,
    } as MethodsState,
    {
      reducerMapper: combineReducers,
      enableLoading: true,
    },
    useMethods
  )

export { useCountContext, CounterProvider, withCountProvider }
