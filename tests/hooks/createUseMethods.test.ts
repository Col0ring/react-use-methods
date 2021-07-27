import { act, renderHook } from '@testing-library/react-hooks'
import thunk from 'redux-thunk'
import { createUseMethods } from '../../packages/index'

describe('hook factory createUseMethods', () => {
  it('should init useMethods hook function', () => {
    const useMethods = createUseMethods()
    expect(useMethods).toBeInstanceOf(Function)
  })
})
