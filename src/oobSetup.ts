import { renderDeckList } from "./decks/deckList";
import oobHtml from "./oobSetup.html?raw";
import { ProgressManager } from "./ProgressManager";
import { setApiToken } from "./storage/wkapi";
import { AssignmentHandler } from "./storage/wkapi/assignment";
import { SubjectHandler } from "./storage/wkapi/subject";
import { fetchUser } from "./storage/wkapi/user";

export function renderOOBSetup(popupRoot: HTMLElement) {
  const popupContent = popupRoot.querySelector(".popup-content") as HTMLElement;
  popupContent.innerHTML = oobHtml;

  const apiTokenInput = popupRoot.querySelector(
    ".oob-api-token-input"
  ) as HTMLInputElement;
  const apiTokenSaveButton = popupRoot.querySelector(
    ".oob-submit-button"
  ) as HTMLButtonElement;
  const errorElement = popupRoot.querySelector(
    ".oob-input-error"
  ) as HTMLElement;
  const loader = popupRoot.querySelector(".oob-loader") as HTMLElement;

  apiTokenSaveButton.addEventListener("click", async () => {
    const apiToken = apiTokenInput.value;
    if (apiToken.length === 0) {
      errorElement.textContent = "Please provide a valid API token!";
      return;
    }

    loader.classList.add("active");

    if ((await fetchUser(false, apiToken).catch()) == null) {
      errorElement.textContent = "Please provide a valid API token!";
      loader.classList.remove("active");
      return;
    }

    loader.classList.remove("active");

    await setApiToken(apiToken);

    const promise = SubjectHandler.getInstance().fetchItems();
    ProgressManager.getInstance().handleProgressEvent(
      promise,
      "Loading subjects from WK..."
    );

    promise.finally(() => {
      const promise = AssignmentHandler.getInstance().fetchItems();
      ProgressManager.getInstance().handleProgressEvent(
        promise,
        "Loading assignments from WK..."
      );
    });

    renderDeckList(popupRoot);
  });
}
