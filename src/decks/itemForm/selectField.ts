import { setupButtonGroup } from "./buttonGroup";
import { createErrorElement } from "./error";
import { FieldInstance, FieldRenderer } from "./fields";
import { createItemContainer } from "./itemContainer";

export class SelectFieldRenderer<
  Value extends string
> extends FieldRenderer<Value> {
  constructor(
    name: string,
    private options: Record<Value, string>,
    private helpText?: string
  ) {
    super(name);
  }

  async render(value?: Value): Promise<SelectFieldInstance<Value>> {
    const optionContainer = createItemContainer(this.name, this.helpText);

    const errorElement = createErrorElement();

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    const buttonGroup = document.createElement("div");
    buttonGroup.classList.add("item-button-group");
    Object.entries(this.options).forEach(([key, text], i) => {
      const button = document.createElement("button");
      button.classList.add("item-button", "button");
      button.textContent = text as string;
      button.dataset["value"] = key;
      if (value) {
        if (value === key) {
          button.classList.add("active");
        }
      } else if (i === 0) {
        button.classList.add("active");
      }
      buttonGroup.append(button);
    });
    valueContainer.append(buttonGroup);

    optionContainer.append(valueContainer);

    return new SelectFieldInstance(
      this.name,
      buttonGroup,
      optionContainer,
      errorElement
    );
  }
}

export class SelectFieldInstance<
  Value extends string
> extends FieldInstance<Value> {
  constructor(
    name: string,
    private buttonGroup: HTMLElement,
    private container: HTMLElement,
    private errorElement: HTMLElement
  ) {
    super(name);
    setupButtonGroup(this.buttonGroup, () => this.notifyChange());
  }

  getHTML(): HTMLElement {
    return this.container;
  }

  getValue(): Value {
    const activeButton = this.buttonGroup.querySelector(
      ".active"
    ) as HTMLElement;
    return activeButton.dataset["value"] as Value;
  }

  validate(): boolean {
    return true;
  }

  setErrorMessage(message: string) {
    this.errorElement.textContent = message;
  }
}
