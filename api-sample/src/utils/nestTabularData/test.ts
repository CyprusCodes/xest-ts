import nestTabularData, { NestTransformation } from ".";
// If your tsconfig has "resolveJsonModule": true, you can import JSON directly
import testData from "./testResults.json";

describe("nestTabularData", () => {
  it("should nest tabular result set", () => {
    const transformations: NestTransformation[] = [
      {
        mergeField: "integration_id",
        childrenLabel: "clientIntegrations",
        fieldsToKeep: ["name", "client_id"]
      },
      {
        mergeField: "client_integration_name",
        childrenLabel: "clientSalesChannels",
        fieldsToKeep: ["status", "token"]
      }
    ];

    const result = nestTabularData(testData, transformations);

    expect(result).toMatchSnapshot();
  });
});
