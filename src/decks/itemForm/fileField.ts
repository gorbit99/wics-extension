import { createErrorElement } from "./error";
import { FieldInstance, FieldRenderer } from "./fields";
import { createItemContainer } from "./itemContainer";

export interface FileFieldConstraints {
  accept: string;
}

export class FileFieldRenderer extends FieldRenderer<File> {
  constructor(
    name: string,
    private constraints?: FileFieldConstraints,
    private helpText?: string
  ) {
    super(name);
  }

  async render(): Promise<FieldInstance<File>> {
    const optionContainer = createItemContainer(this.name, this.helpText);

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    const dropDiv = document.createElement("div");
    dropDiv.classList.add("item-option-file-drop");

    const fileDropIcon = document.createElement("i");
    fileDropIcon.classList.add(
      "fas",
      "fa-file-upload",
      "item-option-file-drop-icon"
    );
    dropDiv.append(fileDropIcon, "Drop a file here, or click to select one");

    const errorElement = createErrorElement();

    valueContainer.append(dropDiv, errorElement);
    optionContainer.append(valueContainer);

    return new FileFieldInstance(
      this.name,
      optionContainer,
      dropDiv,
      errorElement,
      this.constraints
    );
  }
}

export class FileFieldInstance extends FieldInstance<File> {
  private value: File | undefined;

  constructor(
    name: string,
    private container: HTMLElement,
    private dropDiv: HTMLElement,
    private errorElement: HTMLElement,
    private constraints?: FileFieldConstraints
  ) {
    super(name);

    dropDiv.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropDiv.classList.add("dragover");
    });

    dropDiv.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropDiv.classList.remove("dragover");
    });

    dropDiv.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropDiv.classList.remove("dragover");
      const files = e.dataTransfer!.files;
      if (files.length > 0) {
        this.value = files[0];
        this.dropDiv.textContent = this.value!.name;
        this.dropDiv.classList.add("file-selected");
        this.notifyChange();
      }
    });

    dropDiv.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = this.constraints?.accept || "";
      input.addEventListener("change", () => {
        if (input.files!.length > 0) {
          this.value = input.files![0];
          this.dropDiv.textContent = this.value!.name;
          this.dropDiv.classList.add("file-selected");
        }
        this.notifyChange();
      });
      input.click();
    });
  }

  getHTML(): HTMLElement | HTMLElement[] | undefined {
    return this.container;
  }

  getValue(): File {
    return this.value!;
  }

  validate(): boolean {
    if (this.value === undefined) {
      this.errorElement.textContent = "This field is required";
      return false;
    }
    return true;
  }

  setErrorMessage(message: string): void {
    this.errorElement.textContent = message;
  }
}
