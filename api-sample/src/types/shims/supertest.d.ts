declare module "supertest" {
  function supertest(app: any): supertest.Test;

  namespace supertest {
    interface Response {
      statusCode: number;
      body: any;
      [key: string]: any;
    }

    interface Test extends PromiseLike<Response> {
      get(url: string): Test;
      put(url: string): Test;
      post(url: string): Test;
      patch(url: string): Test;
      delete(url: string): Test;
      set(field: string, value: string | number): Test;
      send(data?: any): Test;
      [key: string]: any;
    }

    function agent(app?: any): Test;
  }

  export = supertest;
}
