declare function before(
  fn: (this: import("mocha").Context) => any,
  timeout?: number
): void;
declare function after(
  fn: (this: import("mocha").Context) => any,
  timeout?: number
): void;

declare module "mocha" {
  export interface Context {
    [key: string]: any;
  }

  export interface SuiteFunction {
    (title: string, fn?: (this: Context) => void): void;
    only: SuiteFunction;
    skip: SuiteFunction;
  }

  export interface Mocha {
    describe: SuiteFunction;
    [key: string]: any;
  }

  const mocha: Mocha;
  export default mocha;
}
