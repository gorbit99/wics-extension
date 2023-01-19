import { createErrorElement } from "./error";
import {
  FieldGroupInstance,
  FieldGroupRenderer,
  FieldInstance,
  FieldRenderer,
} from "./fields";
import { createItemContainer } from "./itemContainer";

export interface GroupedListFieldConstraints {
  reorderable?: boolean;
  minOptions?: number;
  maxOptions?: number;
}

export class GroupedListFieldRenderer<
  RowValue extends Record<string, any>
> extends FieldRenderer<RowValue[]> {
  constructor(
    name: string,
    private rowRenderer: FieldGroupRenderer<RowValue>,
    private constraints: GroupedListFieldConstraints = {},
    private helpText?: string
  ) {
    super(name);
  }

  async render(value?: RowValue[]): Promise<FieldInstance<RowValue[]>> {
    const hadDefaultValue = value != undefined;

    const container = createItemContainer(this.name, this.helpText);

    const newButton = document.createElement("button");
    newButton.classList.add("button", "item-form-group-list-new-button");
    const fontAwesomeIcon = document.createElement("i");
    fontAwesomeIcon.classList.add(
      "fa",
      "fa-plus",
      "item-form-group-list-add-icon"
    );
    newButton.append(fontAwesomeIcon, "New Row");

    const valueContainer = document.createElement("div");
    valueContainer.classList.add("item-option-value-container");

    const list = document.createElement("div");
    list.classList.add("item-form-group-list-list");
    list.append(newButton);

    if (this.constraints.reorderable) {
      list.classList.add("item-form-reorderable");
    }

    const errorElement = createErrorElement();

    valueContainer.append(list, errorElement);
    container.append(valueContainer);

    const instance = new GroupedListFieldInstance<RowValue>(
      this.name,
      container,
      this.rowRenderer,
      list,
      newButton,
      hadDefaultValue,
      this.constraints
    );

    value?.forEach((rowValue) => instance.addValue(rowValue));

    return instance;
  }
}

export class GroupedListFieldInstance<
  RowValue extends Record<string, any>
> extends FieldInstance<RowValue[]> {
  private instances: FieldGroupInstance<RowValue>[] = [];

  constructor(
    name: string,
    private container: HTMLElement,
    private rowRenderer: FieldGroupRenderer<RowValue>,
    private list: HTMLElement,
    private newButton: HTMLElement,
    private hadDefaultValue: boolean,
    private constraints: GroupedListFieldConstraints
  ) {
    super(name);

    newButton.addEventListener("click", () => this.addValue());

    this.onChange(() => this.updateLimitReached());
  }

  getHTML(): HTMLElement {
    return this.container;
  }

  getValue(): RowValue[] {
    return this.instances.map((instance) => instance.getValue());
  }

  validate(): boolean {
    return this.instances
      .map((instance) => instance.validate(undefined))
      .every((x) => x);
  }

  public async addValue(value?: RowValue): Promise<void> {
    const row = this.createRow(value);
    this.list.insertBefore(await row, this.newButton);
    this.notifyChange();
  }

  private async createRow(value?: RowValue): Promise<HTMLElement> {
    const rowContainer = document.createElement("div");
    rowContainer.classList.add("item-form-group-list-row-container");
    const row = document.createElement("div");
    row.classList.add("item-form-group-list-row");

    const rowInstance = await this.rowRenderer.render(value);
    row.append(...rowInstance.getHTML());
    this.instances.push(rowInstance);
    rowInstance.onChange(() => this.notifyChange());

    const actionsContainer = document.createElement("div");
    actionsContainer.classList.add("item-form-group-list-actions-container");

    const moveUpButton = document.createElement("i");
    moveUpButton.classList.add(
      "fa",
      "fa-caret-up",
      "item-form-group-list-action",
      "item-form-group-list-move-up"
    );
    const moveDownButton = document.createElement("i");
    moveDownButton.classList.add(
      "fa",
      "fa-caret-down",
      "item-form-group-list-action",
      "item-form-group-list-move-down"
    );
    const deleteButton = document.createElement("i");
    deleteButton.classList.add(
      "fa",
      "fa-xmark",
      "item-form-group-list-action",
      "item-form-group-list-delete"
    );

    moveUpButton.addEventListener("click", () => {
      const previous = rowContainer.previousElementSibling;
      if (previous) {
        this.list.insertBefore(rowContainer, previous);
      }

      let index = this.instances.indexOf(rowInstance);
      if (index > 0) {
        this.instances.splice(index, 1);
        this.instances.splice(index - 1, 0, rowInstance);
      }
      this.notifyChange();
    });

    moveDownButton.addEventListener("click", () => {
      const next = rowContainer.nextElementSibling;
      if (next) {
        this.list.insertBefore(next, rowContainer);
      }

      let index = this.instances.indexOf(rowInstance);
      if (index != this.instances.length - 1) {
        this.instances.splice(index, 1);
        this.instances.splice(index + 1, 0, rowInstance);
      }
      this.notifyChange();
    });

    deleteButton.addEventListener("click", () => {
      rowContainer.remove();
      this.instances.splice(this.instances.indexOf(rowInstance), 1);
      this.notifyChange();
    });

    actionsContainer.append(moveUpButton, moveDownButton, deleteButton);

    rowContainer.append(row, actionsContainer);

    return rowContainer;
  }

  private updateLimitReached(): void {
    if (!this.hadDefaultValue) {
      return;
    }
    const values = this.getValue();
    const minReached =
      this.constraints.minOptions != undefined &&
      values.length <= this.constraints.minOptions;
    const maxReached =
      this.constraints.maxOptions != undefined &&
      values.length >= this.constraints.maxOptions;

    this.list.classList.toggle("item-form-group-list-min-reached", minReached);
    this.list.classList.toggle("item-form-group-list-max-reached", maxReached);
  }
}
