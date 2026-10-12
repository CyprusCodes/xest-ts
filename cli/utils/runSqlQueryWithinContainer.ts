import { exec } from "child_process";

const runSqlQueryWithinContainer = (
  sql: string
): Promise<{ error: any; output: string }> => {
  return new Promise((resolve) => {
    exec(sql, (error: any, output: string) => {
      if (error) {
        error = error.toString();
      }

      resolve({
        error,
        output,
      });
    });
  });
};

export default runSqlQueryWithinContainer;
