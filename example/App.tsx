import React from 'react'
import Counter from './Counter'
import ProviderCounterDemo from './ProviderCounterDemo'

const App: React.FC = () => {
  return (
    <>
      <h2>Counter</h2>
      <Counter />
      <h2>ProviderCounterDemo</h2>
      <ProviderCounterDemo />
    </>
  )
}

export default App
