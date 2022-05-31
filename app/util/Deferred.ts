// @ts-nocheck

export default class Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason: any) => void;
  constructor() {
    this.promise = new Promise<T>((res, rej) => {
      this.reject = rej;
      this.resolve = res;
    });
  }
}
