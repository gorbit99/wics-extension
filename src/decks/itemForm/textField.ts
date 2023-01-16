import { createErrorElement } from "./error";
import { FieldInstance, FieldRenderer } from "./fields";
import { createItemContainer } from "./itemContainer";
import { validateLength, validateTextType } from "./validation";

export interface TextFieldConstraints {
  minLength?: number;
  maxLength?: number;
  type?: "kana" | "japanese" | "latin" | "kanji";
}

export class TextFieldRenderer extends FieldRenderer<string> {
  constructor(
    name: string,
    private constraints: TextFieldConstraints = {},
    private helpText?: string
  ) {
    super(name);
  }

  async render(value?: string): Promise<TextFieldInstance> {
    const optionContainer = createItemContainer(this.name, this.helpText);

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    const input = document.createElement("input");
    input.type = "text";
    valueContainer.append(input);

    input.value = value ?? "";

    const errorElement = createErrorElement();

    valueContainer.append(errorElement);
    optionContainer.append(valueContainer);

    return new TextFieldInstance(
      this.name,
      optionContainer,
      input,
      errorElement,
      this.constraints
    );
  }
}

export class TextFieldInstance extends FieldInstance<string> {
  constructor(
    name: string,
    private container: HTMLElement,
    private input: HTMLInputElement,
    private errorElement: HTMLElement,
    private constraints: TextFieldConstraints = {}
  ) {
    super(name);
    input.addEventListener("change", () => {
      this.notifyChange();
    });

    input.addEventListener("blur", () => this.validate());
  }

  getHTML(): HTMLElement {
    return this.container;
  }
  getValue(): string {
    return this.input.value;
  }
  validate(): boolean {
    const value = this.input.value;
    const error =
      validateLength(
        value,
        this.constraints.minLength,
        this.constraints.maxLength
      ) ?? validateTextType(value, this.constraints.type);
    this.errorElement.textContent = error ?? "";
    return !error;
  }

  setErrorMessage(message: string): void {
    this.errorElement.textContent = message;
  }
}
