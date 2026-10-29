const plur = ({
  count,
  singular,
  plural,
  showCount = true
}: {
  count: number;
  singular: string;
  plural: string;
  showCount?: boolean;
}): string => {
  const usesInlineCount =
    singular.includes("{count}") || plural.includes("{count}");
  const word = Math.abs(count) === 1 ? `${singular}` : `${plural}`;
  if (showCount && !usesInlineCount) {
    return `${count} ${word}`;
  }

  return word.replace("{count}", `${count}`);
};

export default plur;
