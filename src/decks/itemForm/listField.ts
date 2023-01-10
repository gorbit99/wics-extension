import { createErrorElement } from "./error";
import { FieldInstance, FieldRenderer } from "./fields";
import { validateLength } from "./validation";

export class ListFieldRenderer extends FieldRenderer<string[]> {
  constructor(
    name: string,
    private innerFieldConstraints: {
      minLength?: number;
      maxLength?: number;
    } = {},
    private minOptions?: number,
    private maxOptions?: number,
    private reorderable: boolean = false
  ) {
    super(name);
  }

  render(value?: string[]): FieldInstance<string[]> {
    return new ListFieldInstance(
      this.name,
      value,
      this.reorderable,
      this.minOptions,
      this.maxOptions,
      this.innerFieldConstraints
    );
  }
}

export class ListFieldInstance extends FieldInstance<string[]> {
  private container: HTMLElement;
  private list: HTMLElement;
  private errorElement: HTMLElement;
  private newButton: HTMLElement;
  private hadDefaultValue: boolean;

  constructor(
    name: string,
    value?: string[],
    private reorderable: boolean = false,
    private minOptions?: number,
    private maxOptions?: number,
    private innerFieldConstraints?: { minLength?: number; maxLength?: number }
  ) {
    super(name);

    this.hadDefaultValue = value != undefined;

    this.container = document.createElement("div");
    this.container.classList.add("item-option-container");

    const label = document.createElement("label");
    label.classList.add("item-option-label");
    label.textContent = this.name;
    this.container.append(label);

    this.newButton = document.createElement("button");
    this.newButton.classList.add("item-form-list-new-button");
    const fontAwesomeIcon = document.createElement("i");
    fontAwesomeIcon.classList.add("fa");
    fontAwesomeIcon.classList.add("fa-plus");
    this.newButton.append(fontAwesomeIcon);

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    this.list = document.createElement("div");
    this.list.classList.add("item-form-list-option-list");
    this.list.append(this.newButton);

    if (this.reorderable) {
      this.list.classList.add("item-form-reorderable");
    }

    this.errorElement = createErrorElement();

    valueContainer.append(this.list, this.errorElement);

    this.container.append(valueContainer);

    value?.forEach((value) => {
      this.newButton.before(this.createListValue(value));
      this.updateLimitReached();
    });

    this.newButton.addEventListener("click", () => this.createListInput());

    const dropTarget = document.createElement("div");
    dropTarget.classList.add("item-form-list-drop-target");
    this.list.append(dropTarget);

    dropTarget.addEventListener("drop", (event) => {
      event.preventDefault();
      const value = event.dataTransfer!.getData("text/plain");
      const valueElement = this.list.querySelector(
        `.item-form-list-value[data-value="${value}"]`
      )!;
      valueElement.remove();
      this.newButton.before(valueElement);
      delete valueContainer.dataset["dragover"];
    });
    dropTarget.addEventListener("dragover", (event) => {
      valueContainer.dataset["dragover"] = "true";
      event.stopPropagation();
      event.preventDefault();
    });
    dropTarget.addEventListener("dragleave", (event) => {
      delete valueContainer.dataset["dragover"];
      event.preventDefault();
    });
  }

  getHTML(): HTMLElement {
    return this.container;
  }

  getValue(): string[] {
    return [...this.list.querySelectorAll(".item-form-list-value")].map(
      (element) => (element as HTMLElement).dataset["value"] as string
    );
  }

  validate(): boolean {
    if (
      this.minOptions &&
      this.list.querySelectorAll(".item-form-list-value").length <
      this.minOptions
    ) {
      this.errorElement.textContent = `At least ${this.minOptions} value${this.minOptions === 1 ? "" : "s"
        } required`;
      return false;
    }

    let anyError = false;
    this.list.querySelectorAll(".item-form-list-value").forEach((element) => {
      const error = validateLength(
        element.textContent ?? "",
        this.minOptions,
        this.maxOptions
      );
      if (error) {
        anyError = true;
        (element as HTMLElement).querySelector(
          ".item-form-list-error"
        )!.textContent = error;
      }
    });
    return !anyError;
  }

  private createListInput() {
    const inputField = document.createElement("input");
    inputField.classList.add("item-form-list-input");
    inputField.type = "text";
    this.newButton.replaceWith(inputField);
    inputField.focus();

    inputField.addEventListener("blur", () => {
      const value = inputField.value;

      if (value.length !== 0) {
        const error = validateLength(
          value,
          this.innerFieldConstraints?.minLength,
          this.innerFieldConstraints?.maxLength
        );
        this.errorElement.textContent = error ?? "";
        if (error) {
          inputField.focus();
          return;
        }

        if (
          inputField.parentElement!.querySelector(`[data-value="${value}"]`)
        ) {
          this.errorElement.textContent = "Value already exists";
          inputField.focus();
          return;
        }
      }

      if (value.length > 0) {
        inputField.before(this.createListValue(value));
        this.updateLimitReached();
      }
      this.notifyChange();
      inputField.replaceWith(this.newButton);
    });

    inputField.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        inputField.blur();
      }
      if (event.key === "Escape") {
        inputField.value = "";
        this.errorElement.textContent = "";
        inputField.blur();
      }
    });
  }

  private createListValue(value: string): HTMLElement {
    const newValue = document.createElement("span");
    newValue.classList.add("item-form-list-value");
    newValue.textContent = value;
    const removeButton = document.createElement("i");
    removeButton.classList.add("item-form-list-remove-button");
    removeButton.classList.add("fa");
    removeButton.classList.add("fa-xmark");
    removeButton.addEventListener("click", () => {
      newValue.remove();
      this.notifyChange();
      this.updateLimitReached();
    });
    newValue.dataset["value"] = value;
    newValue.append(removeButton);

    if (this.reorderable) {
      newValue.draggable = true;
      newValue.addEventListener("dragstart", (event) => {
        event.dataTransfer!.effectAllowed = "move";
        event.dataTransfer!.setData("text/plain", newValue.dataset["value"]!);
      });
      newValue.addEventListener("dragover", (event) => {
        newValue.dataset["dragover"] = "true";
        event.preventDefault();
      });
      newValue.addEventListener("dragleave", (event) => {
        if (event.target !== newValue) {
          return;
        }
        delete newValue.dataset["dragover"];
      });
      newValue.addEventListener("drop", (event) => {
        const value = event.dataTransfer!.getData("text/plain");
        const valueElement = this.list.querySelector(
          `.item-form-list-value[data-value="${value}"]`
        )!;
        if (valueElement !== newValue) {
          valueElement.remove();
          newValue.before(valueElement);
        }
        delete newValue.dataset["dragover"];
        this.notifyChange();
      });
    }

    return newValue;
  }

  private updateLimitReached() {
    if (!this.hadDefaultValue) {
      return;
    }
    const values = this.getValue();
    const minReached =
      this.minOptions !== undefined && values.length <= this.minOptions;
    const maxReached =
      this.maxOptions !== undefined && values.length >= this.maxOptions;

    this.list.classList.toggle("item-form-list-min-reached", minReached);
    this.list.classList.toggle("item-form-list-max-reached", maxReached);
  }
}
