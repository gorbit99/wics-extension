import { createErrorElement } from "./error";
import { validateLength } from "./validation";

export interface TextField {
  type: "text";
  name: string;
  id: string;
  minLength?: number;
  maxLength?: number;
}

export function renderTextField(
  field: TextField
): [HTMLElement, () => string, () => boolean] {
  const optionContainer = document.createElement("div");
  optionContainer.classList.add("item-option-container");

  const valueContainer = document.createElement("div");
  valueContainer.classList.add("item-option-value-container");

  const label = document.createElement("label");
  label.classList.add("item-option-label");
  label.textContent = field.name;
  optionContainer.append(label);

  const input = document.createElement("input");
  input.type = "text";
  valueContainer.append(input);

  const errorElement = createErrorElement();

  valueContainer.append(errorElement);
  optionContainer.append(valueContainer);

  input.addEventListener("blur", () => {
    const value = input.value;
    errorElement.textContent =
      validateLength(value, field.minLength, field.maxLength) ?? "";
  });

  return [
    optionContainer,
    () => input.value,
    () => {
      const value = input.value;
      const error = validateLength(value, field.minLength, field.maxLength);
      errorElement.textContent = error ?? "";
      return !error;
    },
  ];
}
