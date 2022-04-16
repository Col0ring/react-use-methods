# React-Use-Methods

> a minimal state management hooks inspired by react-use

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

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function App() {
  const [{ count, actionLoading }, methods] = useMethods(
    (state) => {
      return {
        methods: {
          increment() {
            return { ...state, count: state.count + 1 }
          },
          incrementDouble() {
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
        },
        actions: {
          // custom action here，support async function
          midReset(...args) {
            // return a function and dispatch custom action
            return async ({ type, dispatch, payload }) => {
              console.log(type) // midReset
              console.log(dispatch) // the dispatch of useReducer
              console.log(payload) // args
              setTimeout(() => {
                dispatch({
                  type: 'reset',
                  payload,
                })
              }, 1000)
            }
          },
          incrementAsync() {
            return async ({ dispatch }) => {
              await wait(2000)
              console.log(
                await dispatch({
                  type: 'incrementAsync2',
                })
              ) // incrementAsync2 end
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
      }
    },
    {
      count: 0,
    },
    {
      enableLoading: true,
    }
  )
  // methods contains all functions in methods and actions and combines them
  return (
    <div>
      {count}
      {JSON.stringify(actionLoading)}
      <button onClick={methods.methods.increment}>increment</button>
      <button onClick={methods.incrementDouble}>incrementDouble</button>
      <button onClick={methods.decrement}>decrement</button>
      <button onClick={() => methods.set(10)}>set 10</button>
      <button onClick={() => methods.reset()}>reset</button>
      <button onClick={() => methods.midReset()}>midReset</button>
    </div>
  )
}
```

You can also use effects：

```tsx
import React from 'react'
import { useMethods } from 'react-use-methods'

function App() {
  const [{ count, actionLoading }, methods] = useMethods(
    (state, getState) => {
      return {
        methods: {
          increment() {
            return { ...state, count: state.count + 1 }
          },
          incrementDouble() {
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
        },
        effects: {
          count(dispatch, newValue, oldValue) {
            console.log(state, getState())
            console.log(newValue, oldValue)
            if (newValue < 0) {
              dispatch({
                type: 'increment',
              })
            }
          },
        },
      }
    },
    {
      count: 0,
    },
    {
      enableLoading: true,
    }
  )
  return (
    <div>
      {count}
      {JSON.stringify(actionLoading)}
      <button onClick={methods.increment}>increment</button>
      <button onClick={methods.incrementDouble}>incrementDouble</button>
      <button onClick={methods.decrement}>decrement</button>
      <button onClick={() => methods.set(10)}>set 10</button>
      <button onClick={() => methods.reset()}>reset</button>
    </div>
  )
}
```

#### Reference

```js
const [state, methods, getState] = useMethods(
  createMethods,
  initialState,
  useMethodsOptions
)
```

- `createMethods` : function that takes current state or An object containing methods, actions and effects, return an object containing methods that return updated state.

- `initialState` : initial value of the state.

- `useMethodsOptions`: an object that customizes the internal behavior of useMethods for users.

  ```ts
  import { useReducer, Reducer } from 'react'

  interface UseMethodsOptions<
    S,
    A extends AnyAction,
    L extends boolean = false
  > {
    reducerMapper?: (reducer: Reducer<S, A>) => Reducer<S, A>
    customUseReducer?: typeof useReducer
    enableLoading?: L
  }
  ```

  - reducerMapper: an interface for user to change the native reducer of useMethods (like immer).
  - customUseReducer: a custom hook like `React.useReducer`, and given the second parameter to get the state asynchronously, you can create it by `createUseReducer`( not recommended to use it directly, it should be generated in createUseMethods ).
  - enableLoading: inject the `actionLoading` property into the state，to get the loading state of the action.

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
// note: npm install immer
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
        methods: {
          increment() {
            state.count += 1
            return state
          },
          decrement() {
            return { ...state, count: state.count - 1 }
          },
          reset() {
            state.count = 0
            return state
          },
        },
        actions: {
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

const {
  // set name to change automatically
  useCountContext,
  CountProvider,
  withCountProvider,
  connectCountContext,
} = createMethodsContext(
  (state) => {
    return {
      // if we don't need actions，we can move the methods to the fist level
      increment() {
        state.count += 1
        return state
      },
      incrementDouble() {
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
  {
    useMethodsOptions: {
      reducerMapper: combineReducers,
      enableLoading: true,
    },
    // set the name can help you automatically modify the return value of createMethodsContext
    name: 'count',
    customUseMethods: useMethods,
  }
)

export {
  useCountContext,
  CountProvider,
  withCountProvider,
  connectCountContext,
}
```

```jsx
// index.jsx
import React from 'react'
import { useCountContext, CountProvider } from './provider'

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
    <CountProvider initialValue={{ count: 10 }}>
      <Counter />
    </CountProvider>
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

You can also use `connect` api, like `react-redux`。

```jsx
import React from 'react'
import { useCountContext, connectCountContext } from './provider'

function Counter(props) {
  // inject state and methods by default
  const { state, methods } = props
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

export default connectCountContext(Counter)()
```

For Typescript，you can:

```tsx
import React from 'react'
import {
  connectCountContext,
  useCountContext,
  withCountProvider,
} from './provider'

type CountState = ReturnType<typeof useCountContext>[0]
type CountMethods = ReturnType<typeof useCountContext>[1]

// Don't worry about external Typescript error, the connect function will clear its effects
interface CounterProps {
  state: CountState
  methods: CountMethods
}

function Counter(props: CounterProps) {
  // inject state and methods by default
  const { state, methods } = props
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

export default connectCountContext(Counter)()
```

Accept a mapper function:

```tsx
import React from 'react'
import { connectCountContext, useCountContext, withCountProvider } from './provider'

type CountState = ReturnType<typeof useCountContext>[0]
type CountMethods = ReturnType<typeof useCountContext>[1]

// Don't worry about external Typescript error, the connect function will clear its effects
interface CounterProps{
  count: CountState['count']
  methods: CountMethods
}

function Counter(props: CounterProps) {
  // inject state and methods by default
  const { count, methods } = props
  return (
    <div>
      {count}
      <button onClick={methods.increment}>increment</button>
      <button onClick={methods.incrementDouble}>incrementDouble</button>
      <button onClick={methods.decrement}>decrement</button>
      <button onClick={() => methods.set(10)}>set 10</button>
      <button onClick={() => methods.reset()}>reset</button>
    </div>
  )
}

export default connectCountContext(Counter)(({ count } , methods) => ({
  count,
  methods
})
```

#### Reference

```js
const {
  useMethodsContext,
  MethodsProvider,
  withMethodsProvider,
  connect,
  MethodsContext,
} = createUseMethodsContext(
  createMethods,
  defaultInitialValue,
  createMethodsContextOptions
)
```

- `createMethodsContextOptions`:
  ```ts
  interface CreateMethodsContextOptions<
    S extends Record<Key, any>,
    UM extends CreateUseMethodsReturn<boolean>,
    L extends boolean
  > {
    useMethodsOptions?: UseMethodsOptions<S, AnyAction, L>
    customUseMethods?: UM
    // methods context name, default: methods
    name?: string
  }
  ```
