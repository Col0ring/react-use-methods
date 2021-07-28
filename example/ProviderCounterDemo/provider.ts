import { createMethodsContext, createUseMethods } from '@packages/index'
// immer is important npm install immer
import { combineReducers } from '@packages/reducer-mapper/immer'

// 使用加入 immer
const useMethods = createUseMethods({
  reducerMapper: combineReducers,
})
// 也可加入所有的 redux中间件
// import thunk from 'redux-thunk'
// const useMethods = createUseMethods({
//   reducerMapper: combineReducers
// }, thunk)

export interface MethodsState {
  count: number
}

const [useCountContext, CounterProvider, withCountProvider] =
  createMethodsContext(
    (state) => {
      return {
        increment() {
          state.count += 1
          // 这里可以不导出也不会报错，但是 ts 会报错
          return state
        },
        // 支持异步
        async incrementDouble() {
          // 异步不要使用 immer
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
        midReset() {
          return async ({ dispatch, payload }) => {
            // 可在这里使用诸如 redux-thunk 这样的中间件
            dispatch({
              type: 'reset',
              payload,
            })
          }
        },
      }
    },
    {
      count: 0,
    } as MethodsState,
    useMethods
  )

export { useCountContext, CounterProvider, withCountProvider }
