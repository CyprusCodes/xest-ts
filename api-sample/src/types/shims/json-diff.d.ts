declare module "json-diff" {
  interface JsonDiff {
    diff(first: any, second: any): any;
    diffString(first: any, second: any): string;
    [key: string]: any;
  }

  const jsonDiff: JsonDiff;
  export = jsonDiff;
}
