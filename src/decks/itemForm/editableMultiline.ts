import { createErrorElement } from "../itemForm/error";
import { FieldInstance, FieldRenderer } from "./fields";
import { createItemContainer } from "./itemContainer";

export class EditableMultilineFieldRenderer extends FieldRenderer<string> {
  constructor(name: string, private helpText?: string) {
    super(name);
  }

  async render(value?: string): Promise<FieldInstance<string>> {
    const optionContainer = createItemContainer(this.name, this.helpText);

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    const valueElement = document.createElement("p");
    valueElement.classList.add("item-option-value", "editable");
    valueElement.textContent = value ?? "";
    valueContainer.append(valueElement);

    optionContainer.append(valueContainer);

    return new EditableMultilineFieldInstance(
      this.name,
      valueElement,
      optionContainer
    );
  }
}

export class EditableMultilineFieldInstance extends FieldInstance<string> {
  constructor(
    name: string,
    private valueElement: HTMLElement,
    private container: HTMLElement
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
    return this.valueElement.textContent || "";
  }
  validate(): boolean {
    return true;
  }

  private createInputElement() {
    const input = document.createElement("textarea");
    input.classList.add("item-form-multiline-input");
    input.value = this.valueElement.textContent || "";

    const errorElement = createErrorElement();

    input.addEventListener("blur", () => {
      const value = input.value;

      this.valueElement.textContent = value;
      input.replaceWith(this.valueElement);
      errorElement.remove();
      this.notifyChange();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        if (event.shiftKey) {
          return;
        }
        input.blur();
      }
      if (event.key === "Escape") {
        input.value = this.valueElement.textContent || "";
        input.blur();
      }
    });

    this.valueElement.after(errorElement);
    this.valueElement.replaceWith(input);
    input.focus();
  }
}
