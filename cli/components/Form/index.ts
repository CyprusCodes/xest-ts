import get from "lodash/get";
import inquirer from "inquirer";
import inquirerFileTreeSelection from "inquirer-file-tree-selection-prompt";
inquirer.registerPrompt("file-tree-selection", inquirerFileTreeSelection);
import searchList from "inquirer-search-list";
inquirer.registerPrompt("search-list", searchList);

type FormValues = Record<string, any>;

interface FormQuestion {
  name: string;
  onReply?: (answer: any) => void | Promise<void>;
  [key: string]: any;
}

interface FormField {
  (values: FormValues): FormQuestion | undefined | void;
  isArrayField?: boolean;
}

interface UseForm {
  addField: (fieldFn: FormField) => number;
  addArrayField: (fieldFn: FormField) => { add: () => void };
  getAnswers: () => Promise<FormValues>;
}

const useForm = (): UseForm => {
  const questions: FormField[] = [];
  const values: FormValues = {};
  let answerIndex = 0;

  const addField = (fieldFn: FormField) => questions.push(fieldFn);
  const addArrayField = (fieldFn: FormField) => {
    fieldFn.isArrayField = true;
    questions.push(fieldFn);
    return {
      add: () => {
        questions.splice(answerIndex, 0, fieldFn);
      },
    };
  };

  const getAnswers = async () => {
    for (const question of questions) {
      const questionObj = question(values);
      if (!questionObj) {
        continue;
      }
      const results = await inquirer.prompt(questionObj);
      const answer = get(results, questionObj.name);

      if (question.isArrayField) {
        values[questionObj.name] = values[questionObj.name] || [];
        values[questionObj.name].push(answer);
      } else {
        values[questionObj.name] = answer;
      }
      answerIndex++;

      if (questionObj.onReply) {
        await questionObj.onReply(answer);
      }
    }
    return values;
  };

  return { addField, addArrayField, getAnswers };
};

export default useForm;
