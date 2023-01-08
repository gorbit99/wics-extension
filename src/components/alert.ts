import alertHTML from "./alert/alert.html?raw";
import alertStyle from "./alert/alert.scss?inline";

interface AlertConfig {
  title: string;
  message: string;
  buttons: AlertButton[];
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
      chrome.runtime.onMessage.removeListener(onMessage);
    }
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

  chrome.runtime.onMessage.addListener(onMessage);
}

export function createButtons(
  buttonContainer: HTMLElement,
  buttons: AlertButton[],
  closeAlert: () => void
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
      }
    });
    buttonElement.classList.add(`alert-action-${button.style}`);
    buttonContainer.append(buttonElement);
  });
}

export async function handleDarkModeSwitch(
  alertRoot: HTMLElement
): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get("darkMode", (result) => {
      alertRoot.classList.toggle("dark-mode", result.darkMode);
      resolve();
    });
  });
}

export function closeAllAlerts() {
  document
    .querySelectorAll(".wics-alert-container")
    .forEach((alert) => alert.remove());
}

interface AlertRequest {
  type: "darkModeSwitch";
}
