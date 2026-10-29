import "module-alias/register";
import path from "path";
import dotenv from "dotenv";
// prevent running against production database by mistake

import chai from "chai";
import sinonChai from "sinon-chai";
import deepEqualInAnyOrder from "deep-equal-in-any-order";
import chaiJestSnapshot from "chai-jest-snapshot";
import exitIfProductionDatabase from "~root/utils/exitIfProductionDatabase";
import * as dateSerializer from "../JestSnapshotDateSerializer";
import getTables from "../getTableNames";
import backupTable from "./queries/backupTables";
import dropBackupTable from "./queries/dropBackupTable";

dotenv.config({
  path: path.join(__dirname, "../../../.env")
});
exitIfProductionDatabase();

interface TestContext {
  currentTest: {
    file: string;
    title: string;
  };
}

chai.use(deepEqualInAnyOrder);
chai.use(sinonChai);

// eslint-disable-next-line no-shadow
chai.use((chai) => {
  const { Assertion } = chai;
  Assertion.addMethod("yupSchema", function validate(expectedSchema) {
    // eslint-disable-next-line no-underscore-dangle
    const obj = this._obj;
    new Assertion(() => expectedSchema.validateSync(obj)).not.to.throw();
  });
});

chaiJestSnapshot.addSerializer(dateSerializer);
chai.use(chaiJestSnapshot);

before(async function backup() {
  const tables = await getTables();
  await Promise.all(
    tables.map((table) => backupTable({ tableName: table.tableName }))
  );
});

after(async function dropBackups() {
  const tables = await getTables();
  await Promise.all(
    tables.map((table) => dropBackupTable({ tableName: table.tableName }))
  );
});

before(function resetSnapshotRegistry() {
  chaiJestSnapshot.resetSnapshotRegistry();
});

beforeEach(function configureUsingMochaContext(this: TestContext) {
  const fileName = this.currentTest.file;
  const testName = this.currentTest.title;
  chaiJestSnapshot.configureUsingMochaContext(this);
  chaiJestSnapshot.setFilename(`${fileName}.schnap`);
  chaiJestSnapshot.setTestName(testName);
});
