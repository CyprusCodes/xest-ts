/* SHOULD ONLY BE USED FOR LOCAL PERFORMANCE DEBUGGING

It works across different files as well, 
just import and keep split/print ing.

Example usage:

const stopwatch = require('~root/utils/stopwatch');

function mySlowFunction() {
  stopwatch.start();

  await doSomeSlowOperation();
  stopwatch.split('slow operation 1');

  await doSomeOtherSlowOperation();
  stopwatch.split('slow operation 2');

  stopwatch.print();
}
*/

interface Reading {
  label: string;
  "since beginning": string;
  "since last": string;
  meta: Record<string, any>;
}

interface Lap {
  label: string;
  meta: Record<string, any>;
  timestamp: Date;
}

type ReadingConstructor = new (
  label: string,
  sinceBeginning: string,
  sinceLast: string,
  meta: Record<string, any>
) => Reading;

let laps: Lap[] = [];
let startTime: Date | null | undefined;

const start = (): void => {
  startTime = new Date();
};

const split = (label: string, meta: Record<string, any> = {}): void => {
  if (!startTime) {
    // eslint-disable-next-line no-console
    console.warn("stopwatch was not started, starting now");
    // eslint-disable-next-line no-param-reassign
    label = `start - ${label}`;
    startTime = new Date();
  }
  laps.push({ label, meta, timestamp: new Date() });
};

const reset = (): void => {
  startTime = null;
  laps = [];
};

const getDurationSince = (t1: Date, t2: Date): string => {
  const diff = t1.getTime() - t2.getTime();
  const secondSince = (diff / 1000).toFixed(2);
  const millisecondsSince = diff;

  if (diff > 1000) {
    return `${secondSince} sec.`;
  }
  return `${millisecondsSince} ms.`;
};

function Reading(
  this: Reading,
  label: string,
  sinceBeginning: string,
  sinceLast: string,
  meta: Record<string, any>
) {
  this.label = label;
  this["since beginning"] = sinceBeginning;
  this["since last"] = sinceLast;
  this.meta = meta;
}

const print = (
  label: string = "print - end",
  meta: Record<string, any> = {}
): void => {
  split(label, meta);
  const header = ["label", "since beginning", "since last", "meta"];
  const results = laps.map((l, i) => {
    return new (Reading as unknown as ReadingConstructor)(
      l.label,
      getDurationSince(l.timestamp, startTime!),
      getDurationSince(
        l.timestamp,
        (laps[i - 1] && laps[i - 1].timestamp) || startTime!
      ),
      l.meta
    );
  });
  // eslint-disable-next-line no-console
  console.table([...results], header);
};

export { start, split, reset, print };
