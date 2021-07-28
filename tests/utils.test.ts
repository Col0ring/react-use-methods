import { resolvePromise } from '../packages/utils'

describe('utils resolvePromise', () => {
  it('should resolve a normal value when the parameter is a promise value', async () => {
    expect(await resolvePromise(Promise.resolve(1))).toBe(1)
  })
  it('should resolve a normal value when the parameter is a n-level promise value', async () => {
    expect(
      await resolvePromise(Promise.resolve(Promise.resolve(Promise.resolve(2))))
    ).toBe(2)
  })

  it('should resolve a normal value when the parameter is a normal value', async () => {
    expect(await resolvePromise(Promise.resolve(3))).toBe(3)
  })

  it('should reject an error when the parameter is a rejected promise', async () => {
    // eslint-disable-next-line prefer-promise-reject-errors
    await expect(resolvePromise(Promise.reject(4))).rejects.toBe(4)
  })
})
