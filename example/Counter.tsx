import React from 'react'
import { useMethods } from '@packages/index'
import { combineReducers } from '@packages/reducer-mapper/immer'

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
interface MethodsState {
  count: number
}

const Counter: React.FC = () => {
  const [{ count, actionLoading }, methods] = useMethods(
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
                })
              }, 1000)
              await wait(2000)
            }
          },
          incrementAsync() {
            return async ({ dispatch }) => {
              await wait(2000)
              console.log(
                await dispatch({
                  type: 'incrementAsync2',
                })
              )
              return 'incrementAsync'
            }
          },
          incrementAsync2() {
            return async ({ dispatch }) => {
              await wait(2000)
              dispatch({
                type: 'increment',
              })
              return 'incrementAsync2 end'
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
    () =>
      ({
        count: 0,
      } as MethodsState),
    {
      reducerMapper: combineReducers,
      enableLoading: true,
    }
  )
  console.log(actionLoading)
  return (
    <div>
      {count}
      {JSON.stringify(actionLoading)}
      <button
        onClick={() => {
          console.log(methods.methods.increment())
        }}
      >
        increment
      </button>
      <button onClick={methods.incrementDouble}>incrementDouble</button>
      <button onClick={methods.decrement}>decrement</button>
      <button onClick={() => methods.set(10)}>set 10</button>
      <button onClick={() => methods.reset()}>reset</button>
      <button onClick={() => methods.actions.midReset()}>midReset</button>
      <button
        onClick={async () => {
          console.log(methods.actions.incrementAsync())
        }}
      >
        incrementAsync
      </button>
    </div>
  )
}

export default Counter
