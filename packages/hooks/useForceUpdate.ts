import { useState, useCallback } from 'react'

const mod = 10 ** 9 + 7
function useForceUpdate() {
  const [, setState] = useState(0)
  const forceUpdate = useCallback(() => {
    setState((state) => (state + 1) % mod)
  }, [])
  return forceUpdate
}

export default useForceUpdate
