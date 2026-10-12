declare module "ascii-table" {
  class AsciiTable {
    constructor(title?: string);

    setHeading(...columns: any[]): this;

    addRow(...row: any[]): this;

    toString(): string;
  }
  export = AsciiTable;
}
