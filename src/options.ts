import { Config } from "./config";
import { injectPopup } from "./injectedPopup";
import optionsHtml from "./options.html?raw";
import optionsStyle from "./options.scss?inline";
import { setupHelpElements } from "./options/help";

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
  const lessonPlacementSelect = optionsRoot.querySelector(
    "#lessonPlacementOption"
  ) as HTMLSelectElement;
  lessonPlacementSelect.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement;
    const lessonPlacement = target.value as "front" | "back" | "random";
    Config.getInstance().setConfig("lessonPlacement", lessonPlacement);
  });
  lessonPlacementSelect.value = await Config.getInstance().getLessonPlacement();

  const reviewPlacementSelect = optionsRoot.querySelector(
    "#reviewPlacementOption"
  ) as HTMLSelectElement;
  reviewPlacementSelect.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement;
    const reviewPlacement = target.value as "front" | "back" | "random";
    Config.getInstance().setConfig("reviewPlacement", reviewPlacement);
  });
  reviewPlacementSelect.value = await Config.getInstance().getReviewPlacement();
}
