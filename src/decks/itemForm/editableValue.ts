import { createErrorElement } from "../itemForm/error";
import { validateLength, validateTextType } from "../itemForm/validation";
import { FieldInstance, FieldRenderer } from "./fields";

export class EditableValueFieldRenderer extends FieldRenderer<string> {
  constructor(
    name: string,
    private minLength?: number,
    private maxLength?: number,
    private type: "any" | "kana" | "japanese" | "latin" = "any"
  ) {
    super(name);
  }

  render(value?: string): EditableValueFieldInstance {
    const optionContainer = document.createElement("div");
    optionContainer.classList.add("item-option-container");

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    const label = document.createElement("label");
    label.classList.add("item-option-label");
    label.textContent = this.name;
    optionContainer.append(label);

    const valueElement = document.createElement("span");
    valueElement.classList.add("item-option-value", "editable");
    const textElement = document.createElement("span");
    textElement.classList.add("item-option-value-text");
    textElement.textContent = value ?? "";
    valueElement.append(textElement);

    const errorElement = createErrorElement();

    valueContainer.append(valueElement, errorElement);

    optionContainer.append(valueContainer);

    return new EditableValueFieldInstance(
      this.name,
      valueElement,
      optionContainer,
      errorElement,
      this.minLength,
      this.maxLength,
      this.type
    );
  }
}

export class EditableValueFieldInstance extends FieldInstance<string> {
  constructor(
    name: string,
    private valueElement: HTMLElement,
    private container: HTMLElement,
    private errorElement: HTMLElement,
    private minLength?: number,
    private maxLength?: number,
    private type: "any" | "kana" | "japanese" | "latin" = "any"
  ) {
    super(name);

    valueElement.addEventListener("click", () => {
      this.createInputElement();
    });
  }

  getHTML(): HTMLElement {
    return this.container;
  }

  getValue(): string {
    return this.valueElement.textContent ?? "";
  }

  validate(): boolean {
    const value = this.valueElement.textContent ?? "";
    const error =
      validateLength(value, this.minLength, this.maxLength) ??
      validateTextType(value, this.type);
    this.errorElement.textContent = error ?? "";
    return !error;
  }

  private createInputElement() {
    const input = document.createElement("input");
    input.classList.add("item-option-value-input");
    input.value = this.valueElement.textContent ?? "";

    input.addEventListener("blur", () => {
      const value = input.value;

      const error =
        validateLength(value, this.minLength, this.maxLength) ??
        validateTextType(value, this.type);
      if (error) {
        this.errorElement.textContent = error;
        input.focus();
        return;
      }

      this.valueElement.textContent = value;
      this.errorElement.textContent = "";
      input.replaceWith(this.valueElement);
      this.notifyChange();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        input.blur();
      }
      if (event.key === "Escape") {
        input.value = this.valueElement.textContent || "";
        input.blur();
      }
    });

    this.valueElement.replaceWith(input);
    input.focus();
  }
}
