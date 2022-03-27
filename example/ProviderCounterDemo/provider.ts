import { createMethodsContext, createUseMethods } from '@packages/index'
// make sure immer has been installed
import { combineReducers } from '@packages/reducer-mapper/immer'

import thunk from 'redux-thunk'

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
const useMethods = createUseMethods(
  {
    reducerMapper: combineReducers,
    enableLoading: true,
  },
  thunk
)

export interface MethodsState {
  count: number
}

const { useCountContext, CountProvider, withCountProvider } =
  createMethodsContext(
    (state) => {
      return {
        methods: {
          increment() {
            console.log(state.count)

            state.count += 1
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
            return async ({ dispatch }) => {
              console.log(state.count)
              await wait(500)
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
      useMethodsOptions: {
        reducerMapper: combineReducers,
        enableLoading: true,
      },
      name: 'count',
      customUseMethods: useMethods,
    }
  )

export { useCountContext, CountProvider, withCountProvider }
