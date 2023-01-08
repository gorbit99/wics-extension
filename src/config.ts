export const extensionId = "albbaojcolfeendobnfglielhgkjifnf";

export interface ConfigData {
  lessonPlacement?: "front" | "back" | "random";
  reviewPlacement?: "front" | "back" | "random";
}

const defaultConfig: ConfigData = {
  lessonPlacement: "back",
  reviewPlacement: "random",
};

export class Config {
  private static instance: Config;

  private constructor() { }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  getExtensionId(): string {
    return extensionId;
  }

  getConfig(): Promise<ConfigData> {
    return new Promise((resolve) => {
      chrome.storage.local.get("config", (data) => {
        const config = Object.fromEntries(
          Object.entries(defaultConfig).map(([key, value]) => [
            key,
            data.config?.[key] ?? value,
          ])
        );
        resolve(config);
      });
    });
  }

  async setConfig<Key extends keyof ConfigData>(
    key: Key,
    value: ConfigData[Key]
  ): Promise<void> {
    const config = await this.getConfig();
    config[key] = value;
    return new Promise((resolve) => {
      chrome.storage.local.set({ config }, () => {
        resolve();
      });
    });
  }

  async getLessonPlacement(): Promise<"front" | "back" | "random"> {
    const config = await this.getConfig();
    return config.lessonPlacement ?? "back";
  }

  async getReviewPlacement(): Promise<"front" | "back" | "random"> {
    const config = await this.getConfig();
    return config.reviewPlacement ?? "random";
  }
}
