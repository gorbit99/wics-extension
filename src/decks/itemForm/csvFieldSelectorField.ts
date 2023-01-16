import { createErrorElement } from "./error";
import { FieldInstance, FieldRenderer } from "./fields";
import Papa from "papaparse";
import { createItemContainer } from "./itemContainer";

export interface CsvFieldConstraints {
  requiredFields: string[];
}

export class CsvFieldSelectorFieldRenderer<
  Fields extends string
> extends FieldRenderer<Record<Fields, string>> {
  constructor(
    name: string,
    private fileField: string,
    private separatorField: string,
    private possibleFields: Record<Fields, string>,
    private constraints?: CsvFieldConstraints
  ) {
    super(name);
  }

  async render(): Promise<CsvFieldSelectorFieldInstance<Fields>> {
    const container = document.createElement("div");
    container.classList.add("item-form-csv-field-container");

    const errorElement = createErrorElement();
    const itemContainer = document.createElement("div");
    itemContainer.classList.add("item-form-csv-field-item-container");

    container.append(errorElement, itemContainer);

    return new CsvFieldSelectorFieldInstance(
      this.name,
      this.fileField,
      this.separatorField,
      this.possibleFields,
      container,
      itemContainer,
      errorElement,
      this.constraints
    );
  }
}

export class CsvFieldSelectorFieldInstance<
  Fields extends string
> extends FieldInstance<Record<Fields, string>> {
  private selectedFields: Record<string, string> = {};

  private separator: string = ",";
  private file: File | undefined;

  constructor(
    name: string,
    private fileField: string,
    private separatorField: string,
    private possibleFields: Record<string, string>,
    private container: HTMLElement,
    private itemContainer: HTMLElement,
    private errorElement: HTMLElement,
    private constraints?: CsvFieldConstraints
  ) {
    super(name);
  }

  getHTML(): HTMLElement | HTMLElement[] | undefined {
    return this.container;
  }

  getValue(): Record<string, string> {
    return this.selectedFields;
  }

  parentChanged(field: string, value: any) {
    if (field !== this.fileField && field !== this.separatorField) {
      return;
    }

    if (field === this.fileField) {
      this.file = value as File;
    }

    if (field === this.separatorField) {
      this.separator = value as string;
      if (this.separator === "") {
        this.separator = ",";
      }
      if (this.separator === "\\t") {
        this.separator = "\t";
      }
    }

    this.recreateOptions();
  }

  private recreateOptions() {
    this.itemContainer.innerHTML = "";
    if (!this.file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const csvData = reader.result as string;
      const lines = csvData.split("\n");
      const headers = Papa.parse(lines[0]!, {
        delimiter: this.separator,
        skipEmptyLines: true,
      }).data[0] as string[];

      headers.forEach((header) => {
        const option = this.createOption(header);
        this.itemContainer.append(option);
      });
    };
    reader.readAsText(this.file);
  }

  validate(): boolean {
    if (this.constraints?.requiredFields) {
      const missingFields = this.constraints.requiredFields.filter(
        (field) => !this.selectedFields[field]
      );

      if (missingFields.length > 0) {
        this.errorElement.textContent = `Missing required fields: ${missingFields.join(
          ", "
        )}`;
        return false;
      }
      this.errorElement.textContent = "";

      return missingFields.length === 0;
    }
    return true;
  }

  private createOption(fieldName: string): HTMLElement {
    const container = createItemContainer(fieldName);

    const select = document.createElement("select");
    select.classList.add("item-form-dropdown");

    const noneOption = document.createElement("option");
    noneOption.value = "none";
    noneOption.textContent = "None";
    select.append(noneOption);

    Object.entries(this.possibleFields).forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.append(option);
    });

    select.addEventListener("change", () => {
      if (select.value === "none") {
        delete this.selectedFields[select.value];
      } else {
        this.selectedFields[select.value] = fieldName;
      }
      this.notifyChange();
    });

    container.append(select);

    return container;
  }
}
