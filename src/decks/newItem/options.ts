import { ListField, renderListField } from "./listField";
import { MultiLineField, renderMultilineField } from "./multilineField";
import { renderSelectField, SelectField } from "./selectField";
import { renderTextField, TextField } from "./textField";

type Field = TextField | ListField | MultiLineField | SelectField;

export type Fields = Record<string, Field>;

export function renderOptionFields(
  decksRoot: HTMLElement,
  fields: Fields
): [() => Record<string, string | string[]>, () => boolean] {
  const options = decksRoot.querySelector(".new-item-item-options")!;
  options.innerHTML = "";
  const fieldValues: Record<string, () => string | string[]> = {};
  const fieldValidators: (() => boolean)[] = [];
  for (const field of Object.values(fields)) {
    switch (field.type) {
      case "text":
        const [textField, textValue, textValidator] = renderTextField(field);
        options.append(textField);
        fieldValues[field.id] = textValue;
        fieldValidators.push(textValidator);
        break;
      case "list":
        const [listField, listValue, listValidator] = renderListField(
          field,
          decksRoot
        );
        options.append(listField);
        fieldValues[field.id] = listValue;
        fieldValidators.push(listValidator);
        break;
      case "multi-line":
        const [multilineField, multilineValue, multilineValidator] =
          renderMultilineField(field);
        options.append(multilineField);
        fieldValues[field.id] = multilineValue;
        fieldValidators.push(multilineValidator);
        break;
      case "select":
        const [selectField, selectValue, selectValidator] =
          renderSelectField(field);
        options.append(selectField);
        fieldValues[field.id] = selectValue;
        fieldValidators.push(selectValidator);
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
