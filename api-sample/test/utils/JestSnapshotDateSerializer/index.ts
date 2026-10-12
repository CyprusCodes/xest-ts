// https://github.com/theruther4d/jest-serializer-date/blob/master/index.js
function extractValues(date: Date): {
  year: number;
  month: number;
  date: number;
} {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    date: date.getUTCDate()
  };
}

function isToday(date: Date): boolean {
  const today = extractValues(new Date());
  const value = extractValues(date);

  if (
    today.year !== value.year ||
    today.month !== value.month ||
    today.date !== value.date
  ) {
    return false;
  }

  return true;
}

export function test(val: unknown): boolean {
  if (val && typeof val === "object" && "getFullYear" in val) {
    return true;
  }

  return false;
}

export function print(val: Date): string {
  if (isToday(val)) {
    return `Current Date`;
  }

  const d = extractValues(val);
  return [d.month, d.date, d.year].join("-");
}
