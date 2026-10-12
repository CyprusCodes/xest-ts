declare module "chai-jest-snapshot" {
  interface SnapshotSerializer {
    test(val: any): boolean;
    print(val: any): string;
  }

  interface ChaiJestSnapshot {
    (chai: any, utils: any): void;
    addSerializer(serializer: SnapshotSerializer): void;
    configureUsingMochaContext(context: any): void;
    resetSnapshotRegistry(): void;
    setFilename(filename: string): void;
    setTestName(testName: string): void;
    [key: string]: any;
  }

  const chaiJestSnapshot: ChaiJestSnapshot;
  export = chaiJestSnapshot;
}
