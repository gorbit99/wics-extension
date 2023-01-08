export function createErrorElement(): HTMLElement {
  const errorElement = document.createElement("span");
  errorElement.classList.add("new-item-option-error");
  return errorElement;
}
