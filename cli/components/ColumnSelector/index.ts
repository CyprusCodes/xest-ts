import inquirer from "inquirer";
import isEmpty from "lodash/isEmpty";
import chalk from "chalk";

interface ColumnSelectorOptions {
  columns: any[];
  [key: string]: any;
}

interface ColumnChoice {
  name: string;
  value: string;
}

interface ColumnSelectorQuestion {
  type: string;
  message: string;
  name: string;
  choices: () => ColumnChoice[];
  [key: string]: any;
}

const ColumnSelector = ({
  columns,
  ...rest
}: ColumnSelectorOptions): ColumnSelectorQuestion => {
  return {
    type: "checkbox",
    message: "Select columns",
    name: "columns",
    choices: () => {
      const isSingleTable = columns.every((c) => c.table === columns[0].table);
      return columns.map((column) => {
        let label = `${
          isSingleTable ? "" : `${column.table}.`
        }${chalk.bold`${column.column}`} ${column.columnnType} ${
          column.nullable ? "NULL" : "NOT NULL"
        } `;

        const isPrimaryKey = column.columnKey === "PRI";
        const isForeignKey = !isEmpty(column.foreignKeyTo);

        if (isPrimaryKey) {
          label = label + "PRIMARY";
        }

        if (isForeignKey) {
          label = label + "FOREIGN KEY";
        }

        return { name: label, value: `${column.table}.${column.column}` };
      });
    },
    ...rest,
  };
};

export default ColumnSelector;
