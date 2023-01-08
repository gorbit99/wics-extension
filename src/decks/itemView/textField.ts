export interface TextField {
  type: "text";
  name: string;
  id: string;
  minLength?: number;
  maxLength?: number;
}

export function renderTextField(field: TextField, value: string): HTMLElement {
  const optionContainer = document.createElement("div");
  optionContainer.classList.add("item-option-container");

  const valueContainer = document.createElement("div");
  valueContainer.classList.add("item-option-value-container");

  const label = document.createElement("label");
  label.classList.add("item-option-label");
  label.textContent = field.name;
  optionContainer.append(label);

  const valueElement = document.createElement("span");
  valueElement.classList.add("item-option-value");
  valueElement.dataset["field"] = field.id;
  valueElement.textContent = value;
  valueContainer.append(valueElement);

  optionContainer.append(valueContainer);

  return optionContainer;
}
