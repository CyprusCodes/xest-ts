declare module "sinon" {
  interface SinonMatch {
    [key: string]: any;
  }

  interface SinonStatic {
    match(fn: (obj: any) => boolean, message?: string): SinonMatch;
    match(objOrString: any, string?: string): SinonMatch;
    spy(...args: any[]): any;
    stub(...args: any[]): any;
    restore(): void;
    [key: string]: any;
  }

  const sinon: SinonStatic;
  export = sinon;
}
