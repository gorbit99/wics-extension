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

  async render(value?: Type): Promise<FieldInstance<Type>> {
    return new ComplexFieldInstance(await this.fieldRenderers.render(value));
  }
}

export class ComplexFieldInstance<
  Type extends Record<string, any>
> extends FieldInstance<Type> {
  constructor(private instance: FieldGroupInstance<Type>) {
    super("Complex");
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
