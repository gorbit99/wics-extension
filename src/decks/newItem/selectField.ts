import { setupButtonGroup } from "./buttonGroup";

export interface SelectField {
  type: "select";
  name: string;
  id: string;
  options: {
    text: string;
    value: string;
  }[];
}

export function renderSelectField(
  field: SelectField,
  value?: string,
  onChange?: (value: string) => void
): [HTMLElement, () => string, () => boolean] {
  const optionContainer = document.createElement("div");
  optionContainer.classList.add("item-option-container");

  const label = document.createElement("label");
  label.classList.add("item-option-label");
  label.textContent = field.name;
  optionContainer.append(label);

  const valueContainer = document.createElement("div");
  valueContainer.classList.add("item-option-value-container");

  const buttonGroup = document.createElement("div");
  buttonGroup.classList.add("item-button-group");
  field.options.forEach((option, i) => {
    const button = document.createElement("button");
    button.classList.add("item-button");
    button.textContent = option.text;
    button.dataset["value"] = option.value;
    if (value) {
      if (value === option.value) {
        button.classList.add("active");
      }
    } else if (i === 0) {
      button.classList.add("active");
    }
    buttonGroup.append(button);
  });
  setupButtonGroup(buttonGroup, onChange);
  valueContainer.append(buttonGroup);

  optionContainer.append(valueContainer);

  return [
    optionContainer,
    () => {
      const activeButton = buttonGroup.querySelector(".active");
      return (activeButton as HTMLElement | undefined)?.dataset["value"] ?? "";
    },
    () => true,
  ];
}
