export function createErrorElement(): HTMLElement {
  const errorElement = document.createElement("span");
  errorElement.classList.add("item-form-option-error");
  return errorElement;
}
