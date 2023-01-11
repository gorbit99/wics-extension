import { FieldInstance, FieldRenderer } from "./fields";

export class ConstantFieldRenderer<Type> extends FieldRenderer<Type> {
  constructor(private value: Type) {
    super("Constant");
  }

  render(): ConstantFieldInstance<Type> {
    return new ConstantFieldInstance(this.name, this.value);
  }
}

export class ConstantFieldInstance<Type> extends FieldInstance<Type> {
  constructor(name: string, private value: Type) {
    super(name);
  }

  getHTML(): HTMLElement | undefined {
    return undefined;
  }
  getValue(): Type {
    return this.value;
  }
  validate(): boolean {
    return true;
  }
}
