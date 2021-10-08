import React from 'react'
import { useMethods } from '@packages/index'
import { combineReducers } from '@packages/reducer-mapper/immer'

interface MethodsState {
  count: number
}

const Counter: React.FC = () => {
  const [{ count }, methods] = useMethods(
    (state) => {
      return {
        methods: {
          increment() {
            state.count += 1
            // 这里可以不导出也不会报错，但是 ts 会报错
            return state
          },
          // 支持异步
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
              // 可在这里使用诸如 redux-thunk 这样的中间件
              setTimeout(() => {
                dispatch({
                  type: 'set',
                  payload: [2],
                  dispatch,
                })
              }, 1000)
            }
          },
        },
        effects: {
          count(dispatch, newValue, oldValue) {
            console.log(newValue, oldValue)
            if (newValue > 10) {
              dispatch({
                type: 'reset',
              })
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
    }
  )
  return (
    <div>
      {count}
      <button onClick={methods.methods.increment}>increment</button>
      <button onClick={methods.incrementDouble}>incrementDouble</button>
      <button onClick={methods.decrement}>decrement</button>
      <button onClick={() => methods.set(10)}>set 10</button>
      <button onClick={() => methods.reset()}>reset</button>
      <button onClick={() => methods.actions.midReset()}>midReset</button>
    </div>
  )
}

export default Counter
