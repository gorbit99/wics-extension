import { closeAllAlerts } from "./components/alert";
import injectedPopupHtml from "./injectedPopup.html?raw";
import injectedPopupStyle from "./injectedPopup.scss?inline";
import browser from "webextension-polyfill";
import { injectFonts } from "./fonts";
import { ProgressManager } from "./ProgressManager";

export async function injectPopup(
  style: string,
  title: string,
  onReady: (popupRoot: HTMLElement) => Promise<void>
) {
  closeAllAlerts();
  closeAllPopups();

  const shadowHost = document.createElement("div");
  const shadowRoot = shadowHost.attachShadow({ mode: "open" });
  shadowHost.classList.add("popup-shadow-host");

  injectFonts(shadowRoot);

  const popupRoot = document.createElement("div");
  popupRoot.classList.add("popup-root");
  popupRoot.innerHTML = injectedPopupHtml;

  const titleElement = popupRoot.querySelector(".popup-title") as HTMLElement;
  titleElement.innerText = title;

  shadowRoot.append(popupRoot);

  const popupStyleElement = document.createElement("style");
  popupStyleElement.classList.add("popup-style");
  popupStyleElement.innerHTML = injectedPopupStyle;
  shadowRoot.append(popupStyleElement);

  const childStyleElement = document.createElement("style");
  childStyleElement.classList.add("popup-child-style");
  childStyleElement.innerHTML = style;
  shadowRoot.append(childStyleElement);

  popupRoot
    .querySelector(".popup-close-button")
    ?.addEventListener("click", () => shadowHost.remove());

  await handleDarkModeSwitch(popupRoot);

  ProgressManager.getInstance().setHandler((event, title) =>
    startProgressDisplay(popupRoot, event, title)
  );

  await onReady(popupRoot);

  document.documentElement.append(shadowHost);
  handleDragging(popupRoot);
}

function closeAllPopups() {
  document
    .querySelectorAll(".popup-shadow-host")
    .forEach((host) => host.remove());
}

interface DarkmodeRequest {
  type: "darkModeSwitch";
}

browser.runtime.onMessage.addListener((request: DarkmodeRequest) => {
  switch (request.type) {
    case "darkModeSwitch":
      handleDarkModeSwitch();
      break;
  }
});

export async function handleDarkModeSwitch(
  element?: HTMLElement
): Promise<void> {
  const darkMode = (await browser.storage.local.get("darkMode")).darkMode;
  if (!element) {
    const roots = [...document.querySelectorAll(".popup-shadow-host")].map(
      (host) => host.shadowRoot?.querySelector(".popup-root")!
    );
    roots.forEach((root) => root.classList.toggle("dark", darkMode));
  } else {
    element.classList.toggle("dark", darkMode);
  }
}

function handleDragging(popupRoot: HTMLElement) {
  const header = popupRoot.querySelector(".popup-header") as HTMLElement;

  header.addEventListener("mousedown", (event) => {
    event.preventDefault();
    const popupContainer = popupRoot.querySelector(
      ".popup-container"
    ) as HTMLElement;

    const popupContainerRect = popupContainer.getBoundingClientRect();

    const offsetX = event.clientX - popupContainerRect.left;
    const offsetY = event.clientY - popupContainerRect.top;

    const moveListener = (event: MouseEvent) => {
      event.preventDefault();
      const newX = event.clientX - offsetX;
      const newY = event.clientY - offsetY;

      const confinedX =
        (Math.min(
          Math.max(newX, 0),
          window.innerWidth - popupContainerRect.width
        ) /
          window.innerWidth) *
        100;
      const confinedY =
        (Math.min(
          Math.max(newY, 0),
          window.innerHeight - popupContainerRect.height
        ) /
          window.innerHeight) *
        100;

      popupContainer.style.left = `${confinedX}%`;
      popupContainer.style.top = `${confinedY}%`;
      popupContainer.style.transform = "none";
    };

    const upListener = () => {
      document.removeEventListener("mousemove", moveListener);
      document.removeEventListener("mouseup", upListener);
    };

    document.addEventListener("mousemove", moveListener);
    document.addEventListener("mouseup", upListener);
  });
}

function startProgressDisplay(
  popupRoot: HTMLElement,
  promise: Promise<unknown>,
  title: string
) {
  const progress = popupRoot.querySelector(".popup-progress") as HTMLElement;
  progress.classList.add("active");

  const progressTitle = popupRoot.querySelector(
    ".popup-progress-text"
  ) as HTMLElement;
  progressTitle.innerText = title;

  promise.finally(() => progress.classList.remove("active"));
}
