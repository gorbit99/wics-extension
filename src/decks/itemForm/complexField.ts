import {
  FieldGroupInstance,
  FieldGroupRenderer,
  FieldInstance,
  FieldRenderer,
} from "./fields";

export class ComplexFieldRenderer<
  Type extends Record<string, any>
> extends FieldRenderer<Type> {
  constructor(private fieldRenderers: FieldGroupRenderer<Type>) {
    super("Complex");
  }

  render(value?: Type): FieldInstance<Type> {
    return new ComplexFieldInstance(this.fieldRenderers, value);
  }
}

export class ComplexFieldInstance<
  Type extends Record<string, any>
> extends FieldInstance<Type> {
  private instance: FieldGroupInstance<Type>;

  constructor(
    fieldRenderers: FieldGroupRenderer<Type>,
    value?: Type | undefined
  ) {
    super("Complex");
    this.instance = fieldRenderers.render(value);
    this.instance.onChange(() => this.notifyChange());
  }

  getHTML(): HTMLElement[] {
    return this.instance.getHTML();
  }

  getValue(): Type {
    return this.instance.getValue();
  }

  validate(): boolean {
    return this.instance.validate();
  }
}
