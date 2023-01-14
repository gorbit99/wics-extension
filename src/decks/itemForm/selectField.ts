import { setupButtonGroup } from "./buttonGroup";
import { FieldInstance, FieldRenderer } from "./fields";

export class SelectFieldRenderer<
  Value extends string
> extends FieldRenderer<Value> {
  constructor(name: string, private options: Record<Value, string>) {
    super(name);
  }

  async render(value?: Value): Promise<SelectFieldInstance<Value>> {
    const optionContainer = document.createElement("div");
    optionContainer.classList.add("item-option-container");

    const label = document.createElement("label");
    label.classList.add("item-option-label");
    label.textContent = this.name;
    optionContainer.append(label);

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

    return new SelectFieldInstance(this.name, buttonGroup, optionContainer);
  }
}

export class SelectFieldInstance<
  Value extends string
> extends FieldInstance<Value> {
  constructor(
    name: string,
    private buttonGroup: HTMLElement,
    private container: HTMLElement
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
}
