import AsciiTable from "ascii-table";

const generateTable = ({
  title = "Table Title",
  columnHeaders = ["A", "B", "C"],
  rows = [["", "", ""]]
}: {
  title?: string;
  columnHeaders?: Array<string | number>;
  rows?: Array<Array<string | number>>;
}): string => {
  const table = new AsciiTable(title);
  table.setHeading(...columnHeaders);
  rows.forEach((r) => {
    table.addRow(...r);
  });
  return table.toString();
};

export default generateTable;
