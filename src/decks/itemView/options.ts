import { FieldValue } from "../../wanikani";
import { renderEditableMultilineField } from "../itemForm/editableMultiline";
import { renderEditableValue } from "../itemForm/editableValue";
import { ListField, renderListField } from "../newItem/listField";
import {
  MultiLineField,
  renderMultilineField,
} from "../newItem/multilineField";
import { renderSelectField, SelectField } from "../newItem/selectField";
import { TextField } from "../newItem/textField";

type Field = TextField | ListField | MultiLineField | SelectField;

export type Fields = Record<string, Field>;

export function renderOptionFields(
  decksRoot: HTMLElement,
  fields: Fields,
  getValue: (id: string) => FieldValue,
  setValue: (id: string, value: FieldValue) => void
): [() => Record<string, string | string[]>, () => boolean] {
  const options = decksRoot.querySelector(".item-view-specific-data")!;
  options.innerHTML = "";
  const fieldValues: Record<string, () => string | string[]> = {};
  const fieldValidators: (() => boolean)[] = [];
  for (const field of Object.values(fields)) {
    switch (field.type) {
      case "text":
        const textField = renderEditableValue(
          field,
          getValue(field.id) as string,
          (value) => setValue(field.id, value)
        );
        options.append(textField);
        break;
      case "list":
        const [listField] = renderListField(
          field,
          decksRoot,
          getValue(field.id) as string[],
          (value) => setValue(field.id, value)
        );
        options.append(listField);
        break;
      case "multi-line":
        const multilineField = renderEditableMultilineField(
          field,
          getValue(field.id) as string,
          (value) => setValue(field.id, value)
        );
        options.append(multilineField);
        break;
      case "select":
        const [selectField] = renderSelectField(
          field,
          getValue(field.id) as string,
          (value: string) => setValue(field.id, value)
        );
        options.append(selectField);
        break;
    }
  }
  return [() => getValues(fieldValues), () => validate(fieldValidators)];
}

function getValues(fieldValues: Record<string, () => string | string[]>) {
  const values: Record<string, string | string[]> = {};
  for (const [id, getValue] of Object.entries(fieldValues)) {
    values[id] = getValue();
  }
  return values;
}

function validate(fieldValidators: (() => boolean)[]) {
  return fieldValidators.map((validate) => validate()).every((v) => v);
}
