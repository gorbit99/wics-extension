import alertHTML from "./alert/alert.html?raw";
import alertStyle from "./alert/alert.scss?inline";

import browser from "webextension-polyfill";
import { injectFonts } from "../fonts";

interface AlertConfig {
  title: string;
  message: string;
  buttons: AlertButton[];
  afterClosing?: () => void;
}

interface AlertButton {
  text: string;
  handler: () => boolean | Promise<boolean>;
  style: ButtonStyle;
}

type ButtonStyle = "primary" | "secondary" | "danger";

export async function createAlert(config: AlertConfig) {
  const shadowContainer = document.createElement("div");
  shadowContainer.classList.add("wics-alert-container");
  const shadowDom = shadowContainer.attachShadow({ mode: "closed" });
  injectFonts(shadowDom);

  shadowDom.innerHTML = alertHTML;

  const styleElement = document.createElement("style");
  styleElement.innerHTML = alertStyle;
  shadowDom.append(styleElement);

  const titleElement = shadowDom.querySelector(".alert-title") as HTMLElement;
  titleElement.innerText = config.title;
  const messageElement = shadowDom.querySelector(
    ".alert-message"
  ) as HTMLElement;
  messageElement.innerText = config.message;

  createButtons(
    shadowDom.querySelector(".alert-actions")!,
    config.buttons,
    () => {
      shadowContainer.remove();
      browser.runtime.onMessage.removeListener(onMessage);
    },
    config.afterClosing
  );

  await handleDarkModeSwitch(shadowDom.querySelector(".alert-root")!);

  document.documentElement.append(shadowContainer);

  const onMessage = (request: AlertRequest) => {
    switch (request.type) {
      case "darkModeSwitch":
        handleDarkModeSwitch(shadowDom.querySelector(".alert-root")!);
        break;
    }
  };

  browser.runtime.onMessage.addListener(onMessage);
}

export function createButtons(
  buttonContainer: HTMLElement,
  buttons: AlertButton[],
  closeAlert: () => void,
  afterClosing?: () => void
) {
  const buttonTemplate = buttonContainer.querySelector(
    ".alert-action-template"
  ) as HTMLTemplateElement;

  buttons.forEach((button) => {
    const buttonElement = buttonTemplate.content.firstElementChild!.cloneNode(
      true
    ) as HTMLElement;
    buttonElement.textContent = button.text;
    buttonElement.addEventListener("click", async () => {
      if (await button.handler()) {
        closeAlert();
        afterClosing?.();
      }
    });
    const buttonClass = {
      primary: "",
      secondary: "button-secondary",
      danger: "button-danger",
    }[button.style];
    if (buttonClass !== "") {
      buttonElement.classList.add(buttonClass);
    }
    buttonContainer.append(buttonElement);
  });
}

export async function handleDarkModeSwitch(
  alertRoot: HTMLElement
): Promise<void> {
  const darkMode = (await browser.storage.local.get("darkMode")).darkMode;
  alertRoot.classList.toggle("dark", darkMode);
}

export function closeAllAlerts() {
  document
    .querySelectorAll(".wics-alert-container")
    .forEach((alert) => alert.remove());
}

interface AlertRequest {
  type: "darkModeSwitch";
}
