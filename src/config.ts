import browser from "webextension-polyfill";
import { ConfigData } from "./configData";

const defaultConfig: ConfigData = {
  lessonPlacement: "back",
  reviewPlacement: "random",
  csvImportFieldStyle: "fieldName",
};

export class Config {
  private static instance: Config;

  private constructor() {}

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  async getConfig(): Promise<ConfigData> {
    const config = (await browser.storage.local.get("config")).config ?? {};
    const patchedConfig = Object.assign({}, defaultConfig, config);
    return patchedConfig as ConfigData;
  }

  async setConfig<Key extends keyof ConfigData>(
    key: Key,
    value: ConfigData[Key]
  ): Promise<void> {
    const config = await this.getConfig();
    config[key] = value;
    return browser.storage.local.set({ config });
  }
}
