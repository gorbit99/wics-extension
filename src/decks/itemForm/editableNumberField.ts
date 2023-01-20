import { createErrorElement } from "../itemForm/error";
import { FieldInstance, FieldRenderer } from "./fields";
import { createItemContainer } from "./itemContainer";

interface EditableNumberFieldConstraints {
  min?: number;
  max?: number;
  rational?: boolean;
}

export class EditableNumberFieldRenderer extends FieldRenderer<number> {
  constructor(
    name: string,
    private constraints: EditableNumberFieldConstraints = {},
    private helpText?: string
  ) {
    super(name);
  }

  async render(value?: number): Promise<EditableNumberFieldInstance> {
    const optionContainer = createItemContainer(this.name, this.helpText);

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    const valueElement = document.createElement("span");
    valueElement.classList.add("item-option-value", "editable");
    const textElement = document.createElement("span");
    textElement.classList.add("item-option-value-text");
    textElement.textContent = value?.toString() ?? "";
    valueElement.append(textElement);

    const errorElement = createErrorElement();

    valueContainer.append(valueElement, errorElement);

    optionContainer.append(valueContainer);

    return new EditableNumberFieldInstance(
      this.name,
      valueElement,
      optionContainer,
      errorElement,
      this.constraints
    );
  }
}

export class EditableNumberFieldInstance extends FieldInstance<number> {
  private inputElement: HTMLInputElement | undefined;

  constructor(
    name: string,
    private valueElement: HTMLElement,
    private container: HTMLElement,
    private errorElement: HTMLElement,
    private constraints: EditableNumberFieldConstraints = {}
  ) {
    super(name);

    valueElement.addEventListener("click", () => {
      this.createInputElement();
    });
  }

  getHTML(): HTMLElement {
    return this.container;
  }

  getValue(): number {
    const value = this.inputElement?.value ?? this.valueElement.textContent;
    return parseFloat(value ?? "");
  }

  validate(): boolean {
    const value = this.getValue();
    if (isNaN(value)) {
      this.errorElement.textContent = "Value must be a number";
      return false;
    }
    if (this.constraints.min != undefined && value < this.constraints.min) {
      this.errorElement.innerText = `Value must be at least ${this.constraints.min}`;
      return false;
    }
    if (this.constraints.max != undefined && value > this.constraints.max) {
      this.errorElement.innerText = `Value must be at most ${this.constraints.max}`;
      return false;
    }
    if (this.constraints.rational && !Number.isInteger(value)) {
      this.errorElement.innerText = `Value must be an integer`;
      return false;
    }
    return true;
  }

  private createInputElement() {
    this.inputElement = document.createElement("input");
    this.inputElement.classList.add("item-option-value-input");
    this.inputElement.value = this.valueElement.textContent ?? "";

    this.inputElement.addEventListener("blur", () => {
      const value = this.inputElement!.value;

      if (!this.validate()) {
        this.inputElement!.focus();
        return;
      }

      this.valueElement.textContent = value;
      this.errorElement.textContent = "";
      this.inputElement!.replaceWith(this.valueElement);
      this.inputElement = undefined;
      this.notifyChange();
    });

    this.inputElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.inputElement!.blur();
      }
      if (event.key === "Escape") {
        this.inputElement!.value = this.valueElement.textContent || "";
        this.inputElement!.blur();
      }
    });

    this.valueElement.replaceWith(this.inputElement);
    this.inputElement.focus();
  }

  setErrorMessage(message: string) {
    this.errorElement.textContent = message;
  }
}
