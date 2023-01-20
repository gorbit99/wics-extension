import { ComplexFieldRenderer } from "./complexField";
import { ConstantFieldRenderer } from "./constantField";
import { EditableMultilineFieldRenderer } from "./editableMultiline";
import { EditableNumberFieldRenderer } from "./editableNumberField";
import { EditableValueFieldRenderer } from "./editableValue";
import {
  FieldGroupRenderer,
  FieldGroupRendererFields,
  FieldRenderer,
} from "./fields";
import { FileFieldConstraints, FileFieldRenderer } from "./fileField";
import {
  GroupedListFieldConstraints,
  GroupedListFieldRenderer,
} from "./groupedListField";
import { ListFieldConstraints, ListFieldRenderer } from "./listField";
import { MultiLineFieldRenderer } from "./multilineField";
import { NumberConstraints, NumberFieldRenderer } from "./numberField";
import { SelectFieldRenderer } from "./selectField";
import { TextFieldConstraints, TextFieldRenderer } from "./textField";

export type ItemFormConfig<T extends Record<string, unknown>> = {
  [K in keyof T]: ItemFormFieldConfig<T[K]>;
};

export function generateForm<
  T extends Record<string, unknown>,
  ValidationParams extends Record<string, any> | undefined = undefined
>(
  config: ItemFormConfig<T>,
  type: "form" | "dataView",
  validationCallback?: (
    value: T,
    validationParms: ValidationParams
  ) => Promise<Partial<Record<keyof T, string>>>
): FieldGroupRenderer<T, ValidationParams> {
  const entries = Object.entries(config) as ItemFormFieldEntry<T>[];
  const fieldEntries = entries.map(([name, fieldConfig]) =>
    generateFormField(name as string, type, fieldConfig)
  ) as [string, FieldRenderer<any>][];

  const fields = Object.fromEntries(
    fieldEntries
  ) as FieldGroupRendererFields<T>;
  return new FieldGroupRenderer<T, ValidationParams>(fields, {
    validationCallback,
  });
}

function generateFormField<Type>(
  name: string,
  type: "form" | "dataView",
  fieldConfig: ItemFormFieldConfig<Type>
): [string, FieldRenderer<any>] {
  switch (fieldConfig.type) {
    case "text":
      if (type === "form") {
        return [
          name,
          new TextFieldRenderer(
            fieldConfig.name,
            fieldConfig.constraints as TextFieldConstraints,
            fieldConfig.helpText
          ),
        ];
      } else {
        return [
          name,
          new EditableValueFieldRenderer(
            fieldConfig.name,
            fieldConfig.constraints as TextFieldConstraints,
            fieldConfig.helpText
          ),
        ];
      }
    case "select":
      return [
        name,
        new SelectFieldRenderer(
          fieldConfig.name,
          fieldConfig.options,
          fieldConfig.helpText
        ),
      ];
    case "multiLine":
      if (type === "form") {
        return [
          name,
          new MultiLineFieldRenderer(fieldConfig.name, fieldConfig.helpText),
        ];
      } else {
        return [
          name,
          new EditableMultilineFieldRenderer(
            fieldConfig.name,
            fieldConfig.helpText
          ),
        ];
      }
    case "list":
      return [
        name,
        new ListFieldRenderer(
          fieldConfig.name,
          fieldConfig.constraints as ListFieldConstraints,
          fieldConfig.helpText
        ),
      ];
    case "file":
      return [
        name,
        new FileFieldRenderer(
          fieldConfig.name,
          fieldConfig.constraints,
          fieldConfig.helpText
        ),
      ];
    case "constant":
      return [name, new ConstantFieldRenderer(fieldConfig.value)];
    case "complex":
      return [
        name,
        new ComplexFieldRenderer(generateForm(fieldConfig.fields, type)),
      ];
    case "groupedList":
      return [
        name,
        new GroupedListFieldRenderer(
          fieldConfig.name,
          generateForm(fieldConfig.fields, type),
          fieldConfig.constraints,
          fieldConfig.helpText
        ),
      ];
    case "choice":
      return generateFormField(
        name,
        type,
        type === "form" ? fieldConfig.formField : fieldConfig.dataViewField
      );
    case "number":
      if (type === "form") {
        return [
          name,
          new NumberFieldRenderer(
            fieldConfig.name,
            fieldConfig.constraints as NumberConstraints,
            fieldConfig.helpText
          ),
        ];
      }
      return [
        name,
        new EditableNumberFieldRenderer(
          fieldConfig.name,
          fieldConfig.constraints as NumberConstraints,
          fieldConfig.helpText
        ),
      ];
  }
}

type ItemFormFieldEntry<T extends Record<string, any>> = [
  keyof T,
  ItemFormFieldConfig<T[keyof T]>
];

type ItemFormFieldConfig<FieldType> =
  | (FieldType extends string
      ? TextFieldConfig | SelectFieldConfig<FieldType> | MultiLineFieldConfig
      : FieldType extends string[]
      ? ListFieldConfig
      : FieldType extends number
      ? NumberFieldConfig
      : FieldType extends File
      ? FileFieldConfig
      : FieldType extends Record<string, any>[]
      ? GroupedListFieldConfig<FieldType[number]>
      : FieldType extends Record<string, any>
      ? ComplexFieldConfig<FieldType>
      : never)
  | ConstantFieldConfig<FieldType>
  | ChoiceFieldConfig<FieldType>;

interface ItemFormField {
  type: string;
  name: string;
  helpText?: string;
}

interface TextFieldConfig extends ItemFormField {
  type: "text";
  constraints?: TextFieldConstraints;
}

interface MultiLineFieldConfig extends ItemFormField {
  type: "multiLine";
}

interface SelectFieldConfig<Value extends string> extends ItemFormField {
  type: "select";
  options: Record<Value, string>;
}

interface ListFieldConfig extends ItemFormField {
  type: "list";
  constraints?: ListFieldConstraints;
}

interface FileFieldConfig extends ItemFormField {
  type: "file";
  constraints?: FileFieldConstraints;
}

interface ConstantFieldConfig<Type> extends ItemFormField {
  type: "constant";
  value: Type;
}

interface ComplexFieldConfig<Type extends Record<string, unknown>>
  extends ItemFormField {
  type: "complex";
  fields: ItemFormConfig<Type>;
}

interface GroupedListFieldConfig<Type extends Record<string, unknown>>
  extends ItemFormField {
  type: "groupedList";
  fields: ItemFormConfig<Type>;
  constraints?: GroupedListFieldConstraints;
}

interface NumberFieldConfig extends ItemFormField {
  type: "number";
  constraints?: NumberConstraints;
}

interface ChoiceFieldConfig<Type> extends ItemFormField {
  type: "choice";
  formField: ItemFormFieldConfig<Type>;
  dataViewField: ItemFormFieldConfig<Type>;
}
