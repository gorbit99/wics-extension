import deckListHTML from "./deckList.html?raw";
import { StorageHandler } from "../storageHandler";
import { CustomDeck } from "../storage/customDeck";
import { renderDeckView } from "./deckView";
import errors from "./errors";
import { fetchUser } from "../storage/wkapi/user";

export async function renderDeckList(decksRoot: HTMLElement) {
  const decksContent = decksRoot.querySelector(".popup-content") as HTMLElement;
  decksContent.innerHTML = deckListHTML;

  const deckTemplate = decksContent.querySelector(
    ".deck-template"
  ) as HTMLTemplateElement;

  const decksList = decksContent.querySelector(".decks-list") as HTMLElement;

  const decks = await StorageHandler.getInstance().getCustomDecks();

  decks.forEach((deck) => {
    const deckElement = deckTemplate.content.firstElementChild?.cloneNode(
      true
    ) as HTMLElement;
    deckElement.querySelector(".deck-name")!.textContent = deck.getName();
    deckElement.querySelector(".deck-count")!.textContent = `${deck.getItems().length
      } item${deck.getItems().length === 1 ? "" : "s"}`;
    decksList.append(deckElement);
    deckElement.addEventListener("click", () =>
      renderDeckView(deck, decksRoot)
    );
    const progressElement = deckElement.querySelector(
      ".deck-progress-outer"
    ) as HTMLElement;
    progressElement.style.backgroundImage = createProgressGradient(deck);
  });

  createNewDeckElement(decksList, decksRoot);
}

async function createNewDeck(decksList: HTMLElement, decksRoot: HTMLElement) {
  const deckTemplate = decksList.querySelector(
    ".deck-template"
  ) as HTMLTemplateElement;

  const deckElement = deckTemplate.content.firstElementChild?.cloneNode(
    true
  ) as HTMLElement;

  const inputElement = document.createElement("input");
  inputElement.classList.add("deck-name-input");
  deckElement.querySelector(".deck-name")!.replaceWith(inputElement);
  const errorElement = document.createElement("span");
  errorElement.classList.add("deck-name-error");
  inputElement.after(errorElement);

  const cardCountElement = deckElement.querySelector(
    ".deck-count"
  ) as HTMLElement;
  cardCountElement.textContent = "";

  const newDeckElement = decksList.querySelector(".deck-new")!;
  newDeckElement.replaceWith(deckElement);

  inputElement.focus();

  inputElement.addEventListener("blur", () =>
    saveNewDeck(deckElement, decksRoot)
  );
  inputElement.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      inputElement.blur();
    }
    if (e.key === "Escape") {
      inputElement.value = "";
      inputElement.blur();
    }
  });
}

async function saveNewDeck(deck: HTMLElement, decksRoot: HTMLElement) {
  const inputElement = deck.querySelector(
    ".deck-name-input"
  ) as HTMLInputElement;

  const errorElement = deck.querySelector(".deck-name-error") as HTMLElement;
  errorElement.textContent = "";

  if (inputElement.value === "") {
    createNewDeckElement(deck.parentElement as HTMLElement, decksRoot);
    deck.remove();
    return;
  }

  const decks = await StorageHandler.getInstance().getCustomDecks();
  if (decks.some((deck) => deck.getName() === inputElement.value)) {
    errorElement.textContent = errors.deckNameTaken;
    inputElement.focus();
    return;
  }

  const user = await fetchUser();

  const newDeck = new CustomDeck(inputElement.value, user.username);
  await StorageHandler.getInstance().addNewDeck(newDeck);

  const deckNameElement = document.createElement("span");
  deckNameElement.classList.add("deck-name");
  deckNameElement.textContent = newDeck.getName();
  inputElement.replaceWith(deckNameElement);
  errorElement.remove();

  deck.addEventListener("click", () => renderDeckView(newDeck, decksRoot));

  const cardCountElement = deck.querySelector(".deck-count") as HTMLElement;
  cardCountElement.textContent = `0 items`;

  createNewDeckElement(deck.parentElement!, decksRoot);
}

function createNewDeckElement(decksList: HTMLElement, decksRoot: HTMLElement) {
  const newDeckTemplate = decksList.querySelector(
    ".deck-new-template"
  ) as HTMLTemplateElement;
  const newDeckElement = newDeckTemplate.content.firstElementChild?.cloneNode(
    true
  ) as HTMLElement;
  newDeckElement.addEventListener("click", () =>
    createNewDeck(decksList, decksRoot)
  );
  decksList.append(newDeckElement);
}

function createProgressGradient(deck: CustomDeck) {
  const progress = deck.generateLevelBreakdown();
  const itemCount = deck.getItems().length;

  if (itemCount === 0) {
    return "conic-gradient(var(--wanikani-lesson-color) 0deg 360deg)";
  }

  const percentages = Object.values(progress).map((value) =>
    Math.round((value / itemCount) * 100)
  );

  const windowPercentages = [0];
  for (let i = 0; i < percentages.length; i++) {
    windowPercentages.push(windowPercentages[i]! + percentages[i]!);
  }

  return `conic-gradient(
    var(--wanikani-lesson-color) ${windowPercentages[0]} ${windowPercentages[1]}%,
    var(--wanikani-apprentice-color) ${windowPercentages[1]}% ${windowPercentages[2]}%,
    var(--wanikani-guru-color) ${windowPercentages[2]}% ${windowPercentages[3]}%,
    var(--wanikani-master-color) ${windowPercentages[3]}% ${windowPercentages[4]}%,
    var(--wanikani-enlightened-color) ${windowPercentages[4]}% ${windowPercentages[5]}%,
    var(--wanikani-burned-color) ${windowPercentages[5]}% 100%
  )`;
}
