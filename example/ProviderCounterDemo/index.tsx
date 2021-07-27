import React from 'react'
import { useCountContext, withCountProvider } from './provider'

const Counter: React.FC = () => {
  const [state, methods] = useCountContext()
  return (
    <div>
      {state.count}
      <button onClick={methods.increment}>increment</button>
      <button onClick={methods.incrementDouble}>incrementDouble</button>
      <button onClick={methods.decrement}>decrement</button>
      <button onClick={() => methods.set(10)}>set 10</button>
      <button onClick={() => methods.reset()}>reset</button>
      <button onClick={() => methods.midReset()}>midReset</button>
    </div>
  )
}

export default withCountProvider(Counter)
