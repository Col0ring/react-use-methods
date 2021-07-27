import { ResolvePromise } from './type'

export function resolvePromise<T>(value: T) {
  return new Promise<ResolvePromise<T>>((resolve, reject) => {
    if (value instanceof Promise) {
      value
        .then((res) => {
          resolve(resolvePromise(res))
        })
        .catch((err) => reject(err))
    } else {
      resolve(value as ResolvePromise<T>)
    }
  })
}
