import { createUseMethods } from '@packages/index'
import { combineReducers } from '@packages/reducer-mapper/immer'
import React from 'react'
import thunk from 'redux-thunk'

const useMethods = createUseMethods(
  {
    // use immer
    reducerMapper: combineReducers,
  },
  thunk
)

function App() {
  const [{ count }, methods] = useMethods(
    (state) => {
      return {
        increment() {
          state.count += 1
          return state
        },
        decrement() {
          state.count -= 1
          return state
        },
        reset() {
          state.count = 0
          return state
        },
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
      }
    },
    {
      count: 0,
    }
  )
  return (
    <div>
      {count}
      <button onClick={methods.increment}>increment</button>
      <button onClick={methods.decrement}>decrement</button>
      <button onClick={methods.addAndReset}>addAndReset</button>
    </div>
  )
}
export default App
