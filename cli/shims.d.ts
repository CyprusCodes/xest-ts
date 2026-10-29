declare module "inquirer-search-list" {
  const prompt: any;
  export = prompt;
}

declare module "search-in-file" {
  export const fileSearch: (...args: any[]) => Promise<any[]>;
}

declare module "chipper/prog" {
  const chipper: {
    exec: (args: string[], opts?: any) => Promise<any>;
  };
  export = chipper;
}

declare module "quick-score" {
  export const quickScore: (
    query: string,
    scores: any,
    options?: any
  ) => number;
}
