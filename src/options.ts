import { createAlert } from "./components/alert";
import { Config } from "./config";
import { ConfigData } from "./configData";
import { injectPopup } from "./injectedPopup";
import optionsHtml from "./options.html?raw";
import optionsStyle from "./options.scss?inline";
import { setupHelpElements } from "./options/help";
import { setApiToken } from "./storage/wkapi";
import { StorageHandler } from "./storageHandler";
import browser from "webextension-polyfill";

injectPopup(optionsStyle, "Options", async (optionsRoot) => {
  const contentContainer = optionsRoot.querySelector(
    ".popup-content"
  ) as HTMLElement;
  contentContainer.innerHTML = optionsHtml;

  await initializeOptions(optionsRoot);
  setupHelpElements(optionsRoot);

  manageTabs(contentContainer);
});

function manageTabs(contentContainer: HTMLElement) {
  const tabs = [
    ...contentContainer.querySelectorAll(".options-tabs .options-tab"),
  ];

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTab(tab as HTMLElement, contentContainer);
    });
  });
  activateTab(tabs[0] as HTMLElement, contentContainer);
}

function activateTab(tab: HTMLElement, contentContainer: HTMLElement) {
  contentContainer
    .querySelectorAll(".options-tab")
    .forEach((tab) => tab.classList.remove("tab-active"));
  contentContainer
    .querySelectorAll(".options-tab-content")
    .forEach((tab) => tab.classList.remove("tab-active"));
  tab.classList.add("tab-active");
  contentContainer
    .querySelector(`.options-tab-content[data-tab="${tab.dataset.tab}"]`)!
    .classList.add("tab-active");
}

async function initializeOptions(optionsRoot: HTMLElement) {
  const config = await Config.getInstance().getConfig();
  const lessonPlacementSelect = optionsRoot.querySelector(
    "#lessonPlacementOption"
  ) as HTMLSelectElement;
  initializeOption(
    lessonPlacementSelect,
    (value) => (lessonPlacementSelect.value = value),
    () => lessonPlacementSelect.value as ConfigData["lessonPlacement"],
    "lessonPlacement",
    config
  );

  const reviewPlacementSelect = optionsRoot.querySelector(
    "#reviewPlacementOption"
  ) as HTMLSelectElement;
  initializeOption(
    reviewPlacementSelect,
    (value) => (reviewPlacementSelect.value = value),
    () => reviewPlacementSelect.value as ConfigData["reviewPlacement"],
    "reviewPlacement",
    config
  );

  const resetApiKeyButton = optionsRoot.querySelector(
    "#resetApiKey"
  ) as HTMLButtonElement;
  resetApiKeyButton.addEventListener("click", () => {
    createAlert({
      title: "Reset API Key",
      message: "Are you sure you want to reset your API key?",
      buttons: [
        {
          style: "secondary",
          text: "Cancel",
          handler: () => true,
        },
        {
          style: "danger",
          text: "Reset",
          handler: async () => {
            await setApiToken(null);
            return true;
          },
        },
      ],
    });
  });

  const removeAllDecksButton = optionsRoot.querySelector(
    "#removeAllDecks"
  ) as HTMLButtonElement;
  removeAllDecksButton.addEventListener("click", () => {
    createAlert({
      title: "Remove All Decks",
      message: "Are you sure you want to remove all your decks?",
      buttons: [
        {
          style: "secondary",
          text: "Cancel",
          handler: () => true,
        },
        {
          style: "danger",
          text: "Proceed",
          handler: async () => {
            const decks = await StorageHandler.getInstance().getCustomDecks();
            await Promise.all(
              decks.map((deck) =>
                StorageHandler.getInstance().deleteDeck(deck.getName())
              )
            );
            return true;
          },
        },
      ],
    });
  });

  const clearBrowserStorageButton = optionsRoot.querySelector(
    "#clearBrowserStorage"
  ) as HTMLButtonElement;
  clearBrowserStorageButton.addEventListener("click", () => {
    createAlert({
      title: "Clear Browser Storage",
      message: "Are you sure you want to clear your browser storage?",
      buttons: [
        {
          style: "secondary",
          text: "Cancel",
          handler: () => true,
        },
        {
          style: "danger",
          text: "Proceed",
          handler: async () => {
            await browser.storage.local.clear();
            return true;
          },
        },
      ],
    });
  });
}

function initializeOption<Key extends keyof ConfigData>(
  element: HTMLElement,
  setValue: (value: ConfigData[Key]) => void,
  getValue: () => ConfigData[Key],
  key: Key,
  config: ConfigData
) {
  element.addEventListener("change", () => {
    const value = getValue();
    Config.getInstance().setConfig(key as Key, value);
  });
  setValue(config[key]);
}
