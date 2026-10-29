import inquirer from "inquirer";
import searchList from "inquirer-search-list";
inquirer.registerPrompt("search-list", searchList);

interface TableChoice {
  name: string;
  value: string;
}

interface TableSelectorOptions {
  tables: TableChoice[];
  onReply?: (tableNameSelected: string) => void | Promise<void>;
  [key: string]: any;
}

interface TableSelectorQuestion {
  type: string;
  message: string;
  name: string;
  choices: TableChoice[];
  [key: string]: any;
}

const TableColumnSelector = ({
  tables,
  ...rest
}: TableSelectorOptions): TableSelectorQuestion => {
  return {
    type: "search-list",
    message: "Select a table",
    name: "table",
    choices: tables,
    ...rest,
  };
};

export default TableColumnSelector;
