# React-Use-Methods

> a minimalist state management hooks inspired by react-use

Instead of useReducer, give you the best typescript experience.

## Install

```sh
npm install react-use-methods
# or
yarn add react-use-methods
```

## API

### useMethods

Just like [`react-use/useMethods`](https://github.com/streamich/react-use/blob/master/docs/useMethods.md), and make some extensions based on it.

#### Usage

```jsx
import React from 'react'
import { useMethods } from 'react-use-methods'

function App() {
  const [{ count }, methods] = useMethods(
    (state) => {
      return {
        increment() {
          return { ...state, count: state.count + 1 }
        },
        // support async
        async incrementDouble() {
          // state.count *= 2
          return { ...state, count: state.count * 2 }
        },
        decrement() {
          return { ...state, count: state.count - 1 }
        },
        set(current) {
          return { ...state, count: current }
        },
        reset() {
          return { ...state, count: 0 }
        },
        midReset(...args) {
          // return a function and dispatch custom action
          return ({ type, dispatch, payload }) => {
            console.log(type) // midReset
            console.log(dispatch) // the dispatch of useReducer
            console.log(payload) // args
            // custom action here
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
    }
  )
  return (
    <div>
      {count}
      <button onClick={methods.increment}>increment</button>
      <button onClick={methods.incrementDouble}>incrementDouble</button>
      <button onClick={methods.decrement}>decrement</button>
      <button onClick={() => methods.set(10)}>set 10</button>
      <button onClick={() => methods.reset()}>reset</button>
      <button onClick={() => methods.midReset()}>midReset</button>
    </div>
  )
}
```

#### Reference

```js
const [state, methods] = useMethods(
  createMethods,
  initialState,
  useMethodsOptions
)
```

- `createMethods` : function that takes current state and return an object containing methods that return updated state.

- `initialState` : initial value of the state.

- `useMethodsOptions`: an object that customizes the internal behavior of useMethods for users.

  ```ts
  import { useReducer, Reducer } from 'react'

  interface UseMethodsOptions<S, A> {
    reducerMapper?: (reducer: Reducer<S, A>) => Reducer<S, A>
    customUseReducer?: typeof useReducer
  }
  ```

  - reducerMapper: an interface for user to change the native reducer of useMethods (like immer).
  - customUseReducer: a custom hook like `React.useReducer`, you can create it by `createUseReducer`( not recommended to use it directly, it should be generated in createUseMethods ).

### createUseReducer

A factory to create the useReducer hook, same as [react-use/createReducer](https://github.com/streamich/react-use/blob/master/docs/createReducer.md)

### createUseMethods

A factory to create the useMethods hook and you can add middlewares (like redux-thunk) to extend it.

#### Usage

```js
import thunk from 'redux-thunk'
import { createUseMethods } from 'react-use-methods'
// make sure immer has been installed
import { combineReducers } from 'react-use-methods/reducer-mapper/es/immer'
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
        async decrement() {
          // note: do not use immer when return a promise
          return { ...state, count: state.count - 1 }
        },
        reset() {
          state.count = 0
          return state
        },
        addAndReset() {
          return ({ dispatch }) => {
            const addAndReset = () => {
              return (thunkDispatch) => {
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
```

#### Reference

```js
const useMethods = createUseMethods(useMethodsOptions, ...middlewares)
// or
const useMethods = createUseMethods(...middlewares)
```

- `useMethodsOptions`: same as useMethods.
- `middlewares`: custom middlewares for dispatch actions, like redux-thunk.

### createUseMethodsContext

A state management factory function that allows all components in the provider to easily share state.

#### Usage

```js
// provider.js
import { createMethodsContext, createUseMethods } from 'react-use-methods'
// make sure immer has been installed
import { combineReducers } from 'react-use-methods/reducer-mapper/es/immer'

const useMethods = createUseMethods({
  reducerMapper: combineReducers,
})

const [useCountContext, CounterProvider, withCountProvider] =
  createMethodsContext(
    (state) => {
      return {
        increment() {
          state.count += 1
          return state
        },
        async incrementDouble() {
          return { ...state, count: state.count * 2 }
        },
        decrement() {
          state.count -= 1
          return state
        },
        set(current) {
          return { ...state, count: current }
        },
        reset() {
          return { ...state, count: 0 }
        },
      }
    },
    {
      count: 0,
    },
    useMethods
  )

export { useCountContext, CounterProvider, withCountProvider }
```

```jsx
// index.jsx
import React from 'react'
import { useCountContext, CounterProvider } from './provider'

function Counter() {
  const [state, methods] = useCountContext()
  return (
    <div>
      {state.count}
      <button onClick={methods.increment}>increment</button>
      <button onClick={methods.incrementDouble}>incrementDouble</button>
      <button onClick={methods.decrement}>decrement</button>
      <button onClick={() => methods.set(10)}>set 10</button>
      <button onClick={() => methods.reset()}>reset</button>
    </div>
  )
}

function App() {
  return (
    // you can give a new initialValue for different provider
    <CounterProvider initialValue={{ count: 10 }}>
      <Counter />
    </CounterProvider>
  )
}

export default App
```

**or**

```jsx
// index.jsx
import React from 'react'
import { useCountContext, withCountProvider } from './provider'

function Counter() {
  const [state, methods] = useCountContext()
  return (
    <div>
      {state.count}
      <button onClick={methods.increment}>increment</button>
      <button onClick={methods.incrementDouble}>incrementDouble</button>
      <button onClick={methods.decrement}>decrement</button>
      <button onClick={() => methods.set(10)}>set 10</button>
      <button onClick={() => methods.reset()}>reset</button>
    </div>
  )
}

export default withCountProvider(Counter, {
  // provider props
  initialValue: {
    count: 10,
  },
})
```

#### Reference

```js
const [useMethods, MethodsProvider, withMethodsProvider, methodsContext] =
  createUseMethodsContext(createMethods, defaultInitialValue, customUseMethods)
```
