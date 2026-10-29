async function asyncParallel<T, U>(
  array: T[],
  callback: (item: T, index: number, array: T[]) => Promise<U>
): Promise<void> {
  const promises = array.map(callback);
  await Promise.all(promises);
}

export default asyncParallel;
