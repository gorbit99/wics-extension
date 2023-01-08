import { createErrorElement } from "../newItem/error";
import { validateLength } from "../newItem/validation";

export interface TextField {
  type: "text";
  name: string;
  id: string;
  minLength?: number;
  maxLength?: number;
}

export function renderEditableValue(
  field: TextField,
  value: string,
  onChange?: (value: string) => void
): HTMLElement {
  const optionContainer = document.createElement("div");
  optionContainer.classList.add("item-option-container");

  const valueContainer = document.createElement("div");
  valueContainer.classList.add("item-option-value-container");

  const label = document.createElement("label");
  label.classList.add("item-option-label");
  label.textContent = field.name;
  optionContainer.append(label);

  const valueElement = document.createElement("span");
  valueElement.classList.add("item-option-value", "editable");
  valueElement.textContent = value;

  valueElement.addEventListener("click", () => {
    createInputElement(field, valueElement, onChange);
  });

  valueContainer.append(valueElement);

  optionContainer.append(valueContainer);

  return optionContainer;
}

function createInputElement(
  field: TextField,
  valueElement: HTMLElement,
  onChange?: (value: string) => void
) {
  const input = document.createElement("input");
  input.classList.add("item-option-value-input");
  input.value = valueElement.textContent || "";
  input.type = field.type;
  input.id = field.id;

  const errorElement = createErrorElement();

  input.addEventListener("blur", () => {
    const value = input.value;

    const error = validateLength(value, field.minLength, field.maxLength);
    if (error) {
      errorElement.textContent = error;
      input.focus();
      return;
    }

    valueElement.textContent = value;
    errorElement.remove();
    input.replaceWith(valueElement);
    onChange?.(value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      input.blur();
    }
    if (event.key === "Escape") {
      input.value = valueElement.textContent || "";
      input.blur();
    }
  });

  valueElement.replaceWith(input);
  input.after(errorElement);
  input.focus();
}
