import { createErrorElement } from "./error";
import { FieldInstance, FieldRenderer } from "./fields";

export class MultiLineFieldRenderer extends FieldRenderer<string> {
  constructor(name: string) {
    super(name);
  }

  async render(value?: string): Promise<MultiLineFieldInstance> {
    const optionContainer = document.createElement("div");
    optionContainer.classList.add("item-option-container");

    const label = document.createElement("label");
    label.classList.add("item-option-label");
    label.textContent = this.name;
    optionContainer.append(label);

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    const inputField = document.createElement("textarea");
    inputField.classList.add("new-item-multiline-input");
    valueContainer.append(inputField);

    inputField.value = value ?? "";

    const errorElement = createErrorElement();

    valueContainer.append(errorElement);

    optionContainer.append(valueContainer);

    return new MultiLineFieldInstance(this.name, inputField, optionContainer);
  }
}

export class MultiLineFieldInstance extends FieldInstance<string> {
  constructor(
    name: string,
    private input: HTMLTextAreaElement,
    private container: HTMLElement
  ) {
    super(name);
    input.addEventListener("change", () => {
      this.notifyChange();
    });
  }

  getHTML(): HTMLElement {
    return this.container;
  }

  getValue(): string {
    return this.input.value;
  }

  validate(): boolean {
    return true;
  }
}
