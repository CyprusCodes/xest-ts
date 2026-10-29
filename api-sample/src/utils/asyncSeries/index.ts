const asyncSeries = <T, U>(
  tasks: T[],
  fn: (task: T) => Promise<U>
): Promise<U[]> =>
  tasks.reduce<Promise<U[]>>(
    (promiseChain, currentTask) =>
      promiseChain.then((chainResults) =>
        fn(currentTask).then((currentResult) => [
          ...chainResults,
          currentResult
        ])
      ),
    Promise.resolve([])
  );

export default asyncSeries;
