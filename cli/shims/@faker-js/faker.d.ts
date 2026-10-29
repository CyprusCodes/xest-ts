declare module "@faker-js/faker" {
  interface Faker {
    fake: (template: string) => string;
    [key: string]: any;
  }

  const faker: Faker;
  export = faker;
}
