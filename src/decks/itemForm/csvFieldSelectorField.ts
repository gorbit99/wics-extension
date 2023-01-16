import { createErrorElement } from "./error";
import { FieldInstance, FieldRenderer } from "./fields";
import Papa from "papaparse";
import { createItemContainer } from "./itemContainer";
import { Config } from "../../config";

export interface CsvFieldConstraints {
  requiredFields: string[];
}

export class CsvFieldSelectorFieldRenderer<
  Fields extends string
> extends FieldRenderer<Record<Fields, number>> {
  constructor(
    name: string,
    private fileField: string,
    private separatorField: string,
    private possibleFields: Record<Fields, string>,
    private constraints?: CsvFieldConstraints,
    private ignoreHashtagLines = true,
    private defaultSeparator = ","
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
      this.constraints,
      this.ignoreHashtagLines,
      this.defaultSeparator
    );
  }
}

export class CsvFieldSelectorFieldInstance<
  Fields extends string
> extends FieldInstance<Record<Fields, number>> {
  private selectedFields: Record<string, number> = {};

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
    private constraints?: CsvFieldConstraints,
    private ignoreHashtagLines = true,
    defaultSeparator = ","
  ) {
    super(name);
    this.separator = defaultSeparator;
  }

  getHTML(): HTMLElement | HTMLElement[] | undefined {
    return this.container;
  }

  getValue(): Record<string, number> {
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

  private async recreateOptions() {
    this.itemContainer.innerHTML = "";
    if (!this.file) {
      return;
    }

    const csvFieldStyle = (await Config.getInstance().getConfig())
      .csvImportFieldStyle;

    const getHeaders = (data: string[][]) => {
      if (csvFieldStyle === "fieldName") {
        const firstRows = data.slice(0, 3);
        return firstRows[0]!
          .map((_, i) => firstRows.map((row) => row[i]))
          .map((col) => col.join(", "));
      }
      return data[0]?.map((_, i) => `Field ${i + 1}`);
    };

    const getHelperText = (data: string[][]) => {
      if (csvFieldStyle === "fieldName") {
        return data[0]?.map(() => undefined);
      }
      const firstRows = data.slice(0, 10);
      return firstRows[0]!
        .map((_, i) => firstRows.map((row) => row[i]))
        .map((col) =>
          col.join(csvFieldStyle === "hoverTextComma" ? "," : "\n")
        );
    };

    Papa.parse(this.file, {
      delimiter: this.separator,
      skipEmptyLines: true,
      ...(this.ignoreHashtagLines ? { comments: "#" } : {}),
      complete: (results) => {
        const headers = getHeaders(results.data as string[][])!;
        const helperText = getHelperText(results.data as string[][])!;
        (results.data as string[][])[0]!.forEach((_, id) => {
          const option = this.createOption(headers[id]!, helperText[id], id);
          this.itemContainer.append(option);
        });
      },
    });
  }

  validate(): boolean {
    if (this.constraints?.requiredFields) {
      const missingFields = this.constraints.requiredFields.filter(
        (field) => this.selectedFields[field] === undefined
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

  private createOption(
    fieldName: string,
    helperText: string | undefined,
    id: number
  ): HTMLElement {
    const container = createItemContainer(fieldName, helperText);

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
        this.selectedFields[select.value] = id;
      }
      this.notifyChange();
    });

    container.append(select);

    return container;
  }
}
