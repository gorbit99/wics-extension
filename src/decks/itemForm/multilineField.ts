import { createErrorElement } from "./error";
import { FieldInstance, FieldRenderer } from "./fields";
import { createItemContainer } from "./itemContainer";

export class MultiLineFieldRenderer extends FieldRenderer<string> {
  constructor(name: string, private helpText?: string) {
    super(name);
  }

  async render(value?: string): Promise<MultiLineFieldInstance> {
    const optionContainer = createItemContainer(this.name, this.helpText);

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    const inputField = document.createElement("textarea");
    inputField.classList.add("item-form-multiline-input");
    valueContainer.append(inputField);

    inputField.value = value ?? "";

    const errorElement = createErrorElement();

    valueContainer.append(errorElement);

    optionContainer.append(valueContainer);

    return new MultiLineFieldInstance(
      this.name,
      inputField,
      optionContainer,
      errorElement
    );
  }
}

export class MultiLineFieldInstance extends FieldInstance<string> {
  constructor(
    name: string,
    private input: HTMLTextAreaElement,
    private container: HTMLElement,
    private errorElement: HTMLElement
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

  setErrorMessage(message: string) {
    this.errorElement.textContent = message;
  }
}
