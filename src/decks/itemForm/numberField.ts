import { createErrorElement } from "./error";
import { FieldInstance, FieldRenderer } from "./fields";
import { createItemContainer } from "./itemContainer";

export interface NumberConstraints {
  min?: number;
  max?: number;
  rational?: boolean;
}

export class NumberFieldRenderer extends FieldRenderer<number> {
  constructor(
    name: string,
    private constraints: NumberConstraints = {},
    private helpText?: string
  ) {
    super(name);
  }

  async render(value?: number | undefined): Promise<NumberFieldInstance> {
    const optionContainer = createItemContainer(this.name, this.helpText);

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    const input = document.createElement("input");
    input.type = "number";
    input.value = value?.toString() ?? "";
    valueContainer.append(input);

    const errorElement = createErrorElement();
    valueContainer.append(errorElement);
    optionContainer.append(valueContainer);

    return new NumberFieldInstance(
      this.name,
      optionContainer,
      input,
      errorElement,
      this.constraints
    );
  }
}

export class NumberFieldInstance extends FieldInstance<number> {
  constructor(
    name: string,
    private container: HTMLElement,
    private input: HTMLInputElement,
    private errorElement: HTMLElement,
    private constraints: NumberConstraints
  ) {
    super(name);

    input.addEventListener("input", () => {
      this.notifyChange();
    });

    input.addEventListener("blur", () => {
      this.validate();
    });
  }

  getHTML(): HTMLElement | HTMLElement[] | undefined {
    return this.container;
  }

  getValue(): number {
    return parseFloat(this.input.value);
  }

  validate(): boolean | Promise<boolean> {
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
    this.errorElement.innerText = "";
    return true;
  }
}
