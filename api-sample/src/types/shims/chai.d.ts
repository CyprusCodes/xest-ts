declare module "chai" {
  export interface Assertion {
    [key: string]: any;
  }

  export interface AssertionConstructor {
    new (expression: () => unknown, message?: string): Assertion;
    addMethod(
      name: string,
      fn: (this: Assertion, ...args: any[]) => void
    ): void;
    addProperty(name: string, fn: (this: Assertion) => unknown): void;
    prototype: Assertion;
  }

  export interface ChaiStatic {
    expect(expression: any, message?: string): Assertion;
    assert: any;
    Assertion: AssertionConstructor;
    use(fn: (chai: ChaiStatic, utils: any) => any): ChaiStatic;
    use(plugin: any): ChaiStatic;
    [key: string]: any;
  }

  export function expect(expression: any, message?: string): Assertion;
  export const assert: any;

  const chai: ChaiStatic;
  export default chai;
}
