import { createErrorElement } from "./error";
import { FieldInstance, FieldRenderer } from "./fields";
import { validateLength } from "./validation";

export class TextFieldRenderer extends FieldRenderer<string> {
  constructor(
    name: string,
    private minLength?: number,
    private maxLength?: number
  ) {
    super(name);
  }

  render(value?: string): TextFieldInstance {
    const optionContainer = document.createElement("div");
    optionContainer.classList.add("item-option-container");

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    const label = document.createElement("label");
    label.classList.add("item-option-label");
    label.textContent = this.name;
    optionContainer.append(label);

    const input = document.createElement("input");
    input.type = "text";
    valueContainer.append(input);

    input.value = value ?? "";

    const errorElement = createErrorElement();

    valueContainer.append(errorElement);
    optionContainer.append(valueContainer);

    input.addEventListener("blur", () => {
      const value = input.value;
      errorElement.textContent =
        validateLength(value, this.minLength, this.maxLength) ?? "";
    });

    return new TextFieldInstance(
      this.name,
      optionContainer,
      input,
      errorElement,
      this.minLength,
      this.maxLength
    );
  }
}

export class TextFieldInstance extends FieldInstance<string> {
  constructor(
    name: string,
    private container: HTMLElement,
    private input: HTMLInputElement,
    private errorElement: HTMLElement,
    private minLength?: number,
    private maxLength?: number
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
    const value = this.input.value;
    const error = validateLength(value, this.minLength, this.maxLength);
    this.errorElement.textContent = error ?? "";
    return !error;
  }
}
