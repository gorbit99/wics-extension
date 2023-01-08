import { createErrorElement } from "../newItem/error";
import { MultiLineField } from "../newItem/multilineField";

export function renderEditableMultilineField(
  field: MultiLineField,
  value: string,
  onChange?: (value: string) => void
): HTMLElement {
  const optionContainer = document.createElement("div");
  optionContainer.classList.add("item-option-container");

  const label = document.createElement("label");
  label.classList.add("item-option-label");
  label.textContent = field.name;
  optionContainer.append(label);

  const valueContainer = document.createElement("div");
  valueContainer.classList.add("item-option-value-container");

  const valueElement = document.createElement("p");
  valueElement.classList.add("item-option-value", "editable");
  valueElement.textContent = value;
  valueContainer.append(valueElement);

  valueElement.addEventListener("click", () => {
    createInputElement(field, valueElement, onChange);
  });

  optionContainer.append(valueContainer);

  return optionContainer;
}

function createInputElement(
  field: MultiLineField,
  valueElement: HTMLElement,
  onChange?: (value: string) => void
) {
  const input = document.createElement("textarea");
  input.classList.add("item-option-value-input");
  input.value = valueElement.textContent || "";
  input.id = field.id;

  const errorElement = createErrorElement();

  input.addEventListener("blur", () => {
    const value = input.value;

    valueElement.textContent = value;
    input.replaceWith(valueElement);
    errorElement.remove();
    onChange?.(value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      if (event.shiftKey) {
        return;
      }
      input.blur();
    }
    if (event.key === "Escape") {
      input.value = valueElement.textContent || "";
      input.blur();
    }
  });

  valueElement.after(errorElement);
  valueElement.replaceWith(input);
  input.focus();
}
