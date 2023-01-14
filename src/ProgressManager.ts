export class ProgressManager {
  private static instance: ProgressManager | undefined;

  private handler:
    | ((event: Promise<unknown>, message: string) => void)
    | undefined;

  private constructor() { }

  static getInstance(): ProgressManager {
    if (this.instance === undefined) {
      this.instance = new ProgressManager();
    }
    return this.instance;
  }

  public setHandler(
    handler: (event: Promise<unknown>, message: string) => void
  ) {
    this.handler = handler;
  }

  public handleProgressEvent(event: Promise<unknown>, message: string) {
    this.handler?.(event, message);
  }
}
