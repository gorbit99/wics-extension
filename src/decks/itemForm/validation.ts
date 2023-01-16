export function validateLength(
  value: string,
  minLength?: number,
  maxLength?: number
): string | null {
  const endingS = (length: number) => (length > 1 ? "s" : "");
  if (minLength && value.length < minLength) {
    return `Must be at least ${minLength} character${endingS(minLength)}`;
  }
  if (maxLength && value.length > maxLength) {
    return `Must be at most ${maxLength} character${endingS(maxLength)}`;
  }
  return null;
}

export function validateTextType(
  value: string,
  type?: "any" | "kana" | "japanese" | "latin" | "kanji"
): string | null {
  if (type === "any" || !type) {
    return null;
  }

  const regex = {
    kana: /^[\u3040-\u30ff]*$/,
    japanese: /^[\u3040-\u30ff\u4e00-\u9faf]*$/,
    latin: /^[\x20-\x7e]*$/,
    kanji: /^[\u4e00-\u9faf]*$/,
  }[type];

  if (!regex.test(value)) {
    return `Must be entirely made up of ${type} characters`;
  }

  return null;
}
