import { CustomDeck } from "../storage/customDeck";
import { StorageHandler } from "../storageHandler";
import { WKItem } from "../wanikani";
import { renderDeckView } from "./deckView";
import { setupButtonGroup } from "./itemForm/buttonGroup";
import { FieldGroupInstance } from "./itemForm/fields";
import newItemHtml from "./newItem.html?raw";
import { convertToKanji, kanjiInputFields } from "./newItem/kanji";
import { convertToRadical, radicalInputFields } from "./newItem/radical";
import {
  convertToVocabulary,
  vocabularyInputFields,
} from "./newItem/vocabulary";

export function renderNewItem(deck: CustomDeck, decksRoot: HTMLElement) {
  const decksContent = decksRoot.querySelector(".popup-content") as HTMLElement;
  decksContent.innerHTML = newItemHtml;

  decksRoot
    .querySelectorAll(".item-button-group")
    .forEach((buttonGroup) => setupButtonGroup(buttonGroup as HTMLElement));

  const options = decksRoot.querySelector(
    ".new-item-item-options"
  ) as HTMLElement;

  const radicalGroupInstance = radicalInputFields.render();
  const kanjiGroupInstance = kanjiInputFields.render();
  const vocabularyGroupInstance = vocabularyInputFields.render();

  let [getValue, validate]: [() => Record<string, any>, () => boolean] =
    renderInstance(options, radicalGroupInstance);
  let converter: (values: Record<string, any>) => Promise<WKItem> =
    convertToRadical;

  decksRoot
    .querySelector(".new-item-type-select [data-type='radical']")
    ?.addEventListener("click", () => {
      [getValue, validate] = renderInstance(options, radicalGroupInstance);
      converter = convertToRadical;
    });

  decksRoot
    .querySelector(".new-item-type-select [data-type='kanji']")
    ?.addEventListener("click", () => {
      [getValue, validate] = renderInstance(options, kanjiGroupInstance);
      converter = convertToKanji;
    });

  decksRoot
    .querySelector(".new-item-type-select [data-type='vocabulary']")
    ?.addEventListener("click", () => {
      [getValue, validate] = renderInstance(options, vocabularyGroupInstance);
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

function renderInstance<T extends Record<string, any>>(
  optionsContainer: HTMLElement,
  instance: FieldGroupInstance<T>
): [() => T, () => boolean] {
  optionsContainer.innerHTML = "";
  optionsContainer.append(...instance.getHTML());
  return [() => instance.getValue(), () => instance.validate()];
}

function setupBackButton(decksRoot: HTMLElement, deck: CustomDeck) {
  const backButton = decksRoot.querySelector(".back-button") as HTMLElement;
  backButton.addEventListener("click", () => {
    renderDeckView(deck, decksRoot);
  });
}
