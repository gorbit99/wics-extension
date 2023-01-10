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
