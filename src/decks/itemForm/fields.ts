type FieldGroupRendererFields<InputObject> = {
  [key in keyof InputObject]: FieldRenderer<InputObject[key]>;
};

type FieldGroupInstanceFields<InputObject> = {
  [key in keyof InputObject]: FieldRenderer<InputObject[key]>;
};

export class FieldGroupRenderer<T extends Record<string, any>> {
  constructor(private fields: FieldGroupRendererFields<T>) { }

  async render(
    value?: T | ((key: keyof T) => T[typeof key] | Promise<T[typeof key]>)
  ): Promise<FieldGroupInstance<T>> {
    const fields = Object.fromEntries(
      await Promise.all(
        Object.entries(this.fields).map(async ([key, field]) => [
          key,
          await field.render(
            typeof value == "function" ? await value(key) : value?.[key]
          ),
        ])
      )
    );

    return new FieldGroupInstance<T>(fields as FieldGroupInstanceFields<T>);
  }
}

type OnChangeCallback<T extends Record<string, any>, Key extends keyof T> = (
  id: Key,
  value: T[Key]
) => void;

export class FieldGroupInstance<T extends Record<string, any>> {
  constructor(private fields: FieldGroupInstanceFields<T>) {
    Object.entries(this.fields).forEach(([key, field]) => {
      field.onChange((value: T[typeof key]) =>
        this.notifyChange(key as keyof T, value)
      );
    });
  }

  private onChangeListeners: OnChangeCallback<T, keyof T>[] = [];

  getHTML(): [HTMLElement] {
    return Object.values(this.fields)
      .flatMap((field) => field.getHTML())
      .filter((element) => element) as [HTMLElement];
  }

  getValue(): T {
    return Object.fromEntries(
      Object.entries(this.fields).map(([key, field]) => [key, field.getValue()])
    ) as T;
  }

  validate(): boolean {
    return Object.values(this.fields)
      .map((field) => field.validate())
      .every((v) => v);
  }

  onChange(callback: OnChangeCallback<T, keyof T>) {
    this.onChangeListeners.push(callback);
  }

  private notifyChange(id: keyof T, value: T[keyof T]) {
    Object.values(this.fields).forEach((instance) => {
      instance.parentChanged(id, value);
    });
    this.onChangeListeners.forEach((listener) => listener(id, value));
  }
}

export abstract class FieldRenderer<Type> {
  constructor(protected name: string) { }

  abstract render(value?: Type): Promise<FieldInstance<Type>>;
}

export abstract class FieldInstance<Type> {
  constructor(protected name: string) { }

  private onChangeListeners: ((value: Type) => void | Promise<void>)[] = [];

  abstract getHTML(): HTMLElement | HTMLElement[] | undefined;
  abstract getValue(): Type;
  abstract validate(): boolean;

  onChange(listener: (value: Type) => void | Promise<void>) {
    this.onChangeListeners.push(listener);
  }

  protected notifyChange() {
    this.onChangeListeners.forEach((listener) => listener(this.getValue()));
  }

  protected parentChanged(_field: string, _value: any) { }
}
