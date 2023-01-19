export type FieldGroupRendererFields<InputObject> = {
  [key in keyof InputObject]: FieldRenderer<InputObject[key]>;
};

type FieldGroupInstanceFields<InputObject> = {
  [key in keyof InputObject]: FieldInstance<InputObject[key]>;
};

interface FieldGroupConstraints<
  T extends Record<string, unknown>,
  ValidationParams extends Record<string, any> | undefined = undefined
> {
  validationCallback?: (
    value: T,
    validationParams: ValidationParams
  ) => Promise<Partial<Record<keyof T, string>>>;
}
export class FieldGroupRenderer<
  T extends Record<string, any>,
  ValidationParams extends Record<string, any> | undefined = undefined
> {
  constructor(
    private fields: FieldGroupRendererFields<T>,
    private constraints: FieldGroupConstraints<T, ValidationParams>
  ) {}

  async render(
    value?: T | ((key: keyof T) => T[typeof key] | Promise<T[typeof key]>)
  ): Promise<FieldGroupInstance<T, ValidationParams>> {
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

    return new FieldGroupInstance<T, ValidationParams>(
      fields,
      this.constraints
    );
  }
}

type OnChangeCallback<T extends Record<string, any>, Key extends keyof T> = (
  id: Key,
  value: T[Key]
) => void;

export class FieldGroupInstance<
  T extends Record<string, any>,
  ValidationParams extends Record<string, any> | undefined = undefined
> {
  constructor(
    private fields: FieldGroupInstanceFields<T>,
    private constraints: FieldGroupConstraints<T, ValidationParams>
  ) {
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

  async validate(validationParams: ValidationParams): Promise<boolean> {
    const validationResults = await Promise.all(
      Object.values(this.fields).map(
        async (field) => await field.validate(validationParams)
      )
    );

    if (!validationResults.every((v) => v)) {
      return false;
    }

    const value = this.getValue();
    const validationErrors = await this.constraints.validationCallback?.(
      value,
      validationParams
    );
    if (!validationErrors) {
      return true;
    }

    const entries = Object.entries(validationErrors) as [keyof T, string][];

    if (entries.length === 0) {
      return true;
    }

    entries.forEach(([key, message]) => {
      this.fields[key].setErrorMessage(message);
    });
    return false;
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
  constructor(protected name: string) {}

  abstract render(value?: Type): Promise<FieldInstance<Type>>;
}

export abstract class FieldInstance<Type> {
  constructor(protected name: string) {}

  private onChangeListeners: ((value: Type) => void | Promise<void>)[] = [];

  abstract getHTML(): HTMLElement | HTMLElement[] | undefined;
  abstract getValue(): Type;
  abstract validate(): Promise<boolean> | boolean;

  onChange(listener: (value: Type) => void | Promise<void>) {
    this.onChangeListeners.push(listener);
  }

  protected notifyChange() {
    this.onChangeListeners.forEach((listener) => listener(this.getValue()));
  }

  protected parentChanged(_field: string, _value: any) {}

  public setErrorMessage(_message: string) {}
}
