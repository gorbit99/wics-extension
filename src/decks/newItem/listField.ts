import { createErrorElement } from "./error";
import { validateLength } from "./validation";

export interface ListField {
  type: "list";
  name: string;
  id: string;
  minOptions?: number;
  maxOptions?: number;
  reorderable?: boolean;
  innerFieldConstraints: {
    minLength?: number;
    maxLength?: number;
  };
}

export function renderListField(
  field: ListField,
  decksRoot: HTMLElement,
  value?: string[],
  onChange?: (value: string[]) => void
): [HTMLElement, () => string[], () => boolean] {
  const optionContainer = document.createElement("div");
  optionContainer.classList.add("item-option-container");

  const label = document.createElement("label");
  label.classList.add("item-option-label");
  label.textContent = field.name;
  optionContainer.append(label);

  const newButton = document.createElement("button");
  newButton.classList.add("new-item-list-new-button");
  const fontAwesomeIcon = document.createElement("i");
  fontAwesomeIcon.classList.add("fa");
  fontAwesomeIcon.classList.add("fa-plus");
  newButton.append(fontAwesomeIcon);

  const valueContainer = document.createElement("div");
  valueContainer.classList.add("item-option-value-container");

  const list = document.createElement("div");

  value?.forEach((value) => {
    list.append(
      createListValue(field, value, decksRoot, field.reorderable, onChange)
    );
    updateLimitReached(field, list);
  });

  list.classList.add("new-item-list-option-list");
  list.append(newButton);

  if (field.reorderable) {
    list.classList.add("new-item-reorderable");
  }

  const errorElement = createErrorElement();

  valueContainer.append(list, errorElement);

  optionContainer.append(valueContainer);

  newButton.addEventListener("click", () =>
    createListInput(
      field,
      newButton,
      errorElement,
      field.innerFieldConstraints,
      decksRoot,
      field.reorderable,
      onChange
    )
  );

  const dropTarget = document.createElement("div");
  dropTarget.classList.add("new-item-list-drop-target");
  list.append(dropTarget);

  dropTarget.addEventListener("drop", (event) => {
    event.preventDefault();
    const value = event.dataTransfer!.getData("text/plain");
    const valueElement = decksRoot.querySelector(
      `.new-item-list-value[data-value="${value}"]`
    )!;
    valueElement.remove();
    newButton.before(valueElement);
    delete valueContainer.dataset["dragover"];
    onChange?.(getValue(list));
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

  return [
    optionContainer,
    () => getValue(list),
    () => {
      if (
        field.minOptions &&
        list.querySelectorAll(".new-item-list-value").length < field.minOptions
      ) {
        errorElement.textContent = `At least ${field.minOptions} value${field.minOptions === 1 ? "" : "s"
          } required`;
        return false;
      }

      let anyError = false;
      list.querySelectorAll(".new-item-list-value").forEach((element) => {
        const error = validateLength(
          element.textContent ?? "",
          field.minOptions,
          field.maxOptions
        );
        if (error) {
          anyError = true;
          (element as HTMLElement).querySelector(
            ".new-item-list-error"
          )!.textContent = error;
        }
      });
      return !anyError;
    },
  ];
}

function createListInput(
  field: ListField,
  newButton: HTMLElement,
  errorElement: HTMLElement,
  constraints: { minLength?: number; maxLength?: number },
  decksRoot: HTMLElement,
  reorderable?: boolean,
  onChange?: (value: string[]) => void
) {
  const inputField = document.createElement("input");
  inputField.classList.add("new-item-list-input");
  inputField.type = "text";
  newButton.replaceWith(inputField);
  inputField.focus();

  inputField.addEventListener("blur", () => {
    const value = inputField.value;

    if (value.length !== 0) {
      const error = validateLength(
        value,
        constraints.minLength,
        constraints.maxLength
      );
      errorElement.textContent = error ?? "";
      if (error) {
        inputField.focus();
        return;
      }

      if (inputField.parentElement!.querySelector(`[data-value="${value}"]`)) {
        errorElement.textContent = "Value already exists";
        inputField.focus();
        return;
      }
    }

    if (value.length > 0) {
      inputField.before(
        createListValue(field, value, decksRoot, reorderable, onChange)
      );
      updateLimitReached(field, inputField.parentElement!);
    }
    onChange?.(getValue(inputField.parentElement! as HTMLElement));
    inputField.replaceWith(newButton);
  });

  inputField.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      inputField.blur();
    }
    if (event.key === "Escape") {
      inputField.value = "";
      errorElement.textContent = "";
      inputField.blur();
    }
  });
}

function createListValue(
  field: ListField,
  value: string,
  decksRoot: HTMLElement,
  reorderable?: boolean,
  onChange?: (value: string[]) => void
): HTMLElement {
  const newValue = document.createElement("span");
  newValue.classList.add("new-item-list-value");
  newValue.textContent = value;
  const removeButton = document.createElement("i");
  removeButton.classList.add("new-item-list-remove-button");
  removeButton.classList.add("fa");
  removeButton.classList.add("fa-xmark");
  removeButton.addEventListener("click", () => {
    const parent = newValue.parentElement!;
    newValue.remove();
    onChange?.(getValue(parent));
    updateLimitReached(field, parent);
  });
  newValue.dataset["value"] = value;
  newValue.append(removeButton);

  if (reorderable) {
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
      const valueElement = decksRoot.querySelector(
        `.new-item-list-value[data-value="${value}"]`
      )!;
      if (valueElement !== newValue) {
        valueElement.remove();
        newValue.before(valueElement);
      }
      delete newValue.dataset["dragover"];
      onChange?.(getValue(newValue.parentElement!));
    });
  }

  return newValue;
}

function getValue(list: HTMLElement): string[] {
  return [...list.querySelectorAll(".new-item-list-value")].map(
    (element) => (element as HTMLElement).dataset["value"] as string
  );
}

function updateLimitReached(field: ListField, list: HTMLElement) {
  const values = getValue(list);
  const minReached =
    field.minOptions !== undefined && values.length <= field.minOptions;
  const maxReached =
    field.maxOptions !== undefined && values.length >= field.maxOptions;

  list.classList.toggle("new-item-list-min-reached", minReached);
  list.classList.toggle("new-item-list-max-reached", maxReached);
}
