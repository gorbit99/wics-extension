import { CustomDeck } from "../storage/customDeck";
import { StorageHandler } from "../storageHandler";
import { WKItem } from "../wanikani";
import { renderDeckView } from "./deckView";
import newItemHtml from "./newItem.html?raw";
import { setupButtonGroup } from "./newItem/buttonGroup";
import { convertToKanji, kanjiFields } from "./newItem/kanji";
import { renderOptionFields } from "./newItem/options";
import { convertToRadical, radicalFields } from "./newItem/radical";
import { convertToVocabulary, vocabularyFields } from "./newItem/vocabulary";

export function renderNewItem(deck: CustomDeck, decksRoot: HTMLElement) {
  const decksContent = decksRoot.querySelector(".popup-content") as HTMLElement;
  decksContent.innerHTML = newItemHtml;

  decksRoot
    .querySelectorAll(".item-button-group")
    .forEach((buttonGroup) => setupButtonGroup(buttonGroup as HTMLElement));

  let [getValue, validate] = renderOptionFields(decksRoot, radicalFields);
  let converter: (
    values: Record<string, string | string[]>
  ) => Promise<WKItem> = convertToRadical;

  decksRoot
    .querySelector(".new-item-type-select [data-type='radical']")
    ?.addEventListener("click", () => {
      [getValue, validate] = renderOptionFields(decksRoot, radicalFields);
      converter = convertToRadical;
    });

  decksRoot
    .querySelector(".new-item-type-select [data-type='kanji']")
    ?.addEventListener("click", () => {
      [getValue, validate] = renderOptionFields(decksRoot, kanjiFields);
      converter = convertToKanji;
    });

  decksRoot
    .querySelector(".new-item-type-select [data-type='vocabulary']")
    ?.addEventListener("click", () => {
      [getValue, validate] = renderOptionFields(decksRoot, vocabularyFields);
      converter = convertToVocabulary;
    });

  decksRoot
    .querySelector(".new-item-save")
    ?.addEventListener("click", async () => {
      if (!validate()) {
        return;
      }
      const item = await converter(getValue());
      deck.addItem(item);
      await StorageHandler.getInstance().updateDeck(deck.getName(), deck);
      renderDeckView(deck, decksRoot);
    });
  decksRoot.querySelector(".new-item-cancel")?.addEventListener("click", () => {
    renderDeckView(deck, decksRoot);
  });

  setupBackButton(decksRoot, deck);
}

function setupBackButton(decksRoot: HTMLElement, deck: CustomDeck) {
  const backButton = decksRoot.querySelector(".back-button") as HTMLElement;
  backButton.addEventListener("click", () => {
    renderDeckView(deck, decksRoot);
  });
}
