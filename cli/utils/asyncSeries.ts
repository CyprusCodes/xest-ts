const asyncSeries = <T, R>(
  tasks: T[],
  fn: (task: T) => Promise<R>
): Promise<R[]> =>
  tasks.reduce<Promise<R[]>>(
    (promiseChain, currentTask) =>
      promiseChain.then((chainResults) =>
        fn(currentTask).then((currentResult) => [
          ...chainResults,
          currentResult,
        ])
      ),
    Promise.resolve([])
  );

export default asyncSeries;
