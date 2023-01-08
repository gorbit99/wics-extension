import { createErrorElement } from "./error";

export interface MultiLineField {
  type: "multi-line";
  id: string;
  name: string;
}

export function renderMultilineField(
  field: MultiLineField
): [HTMLElement, () => string, () => boolean] {
  const optionContainer = document.createElement("div");
  optionContainer.classList.add("item-option-container");

  const label = document.createElement("label");
  label.classList.add("item-option-label");
  label.textContent = field.name;
  optionContainer.append(label);

  const valueContainer = document.createElement("div");
  valueContainer.classList.add("item-option-value-container");

  const inputField = document.createElement("textarea");
  inputField.classList.add("new-item-multiline-input");
  valueContainer.append(inputField);

  const errorElement = createErrorElement();

  valueContainer.append(errorElement);

  optionContainer.append(valueContainer);

  return [optionContainer, () => inputField.value, () => true];
}
