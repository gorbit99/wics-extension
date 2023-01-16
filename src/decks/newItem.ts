import { ProgressManager } from "../ProgressManager";
import { CustomDeck } from "../storage/customDeck";
import { StorageHandler } from "../storageHandler";
import { WKItem } from "../wanikani";
import { renderDeckView } from "./deckView";
import { FieldGroupInstance } from "./itemForm/fields";
import { SelectFieldRenderer } from "./itemForm/selectField";
import newItemHtml from "./newItem.html?raw";
import { convertToKanji, kanjiInputFields } from "./newItem/kanji";
import { convertToRadical, radicalInputFields } from "./newItem/radical";
import {
  convertToVocabulary,
  vocabularyInputFields,
} from "./newItem/vocabulary";

export async function renderNewItem(deck: CustomDeck, decksRoot: HTMLElement) {
  const decksContent = decksRoot.querySelector(".popup-content") as HTMLElement;
  decksContent.innerHTML = newItemHtml;

  const optionsContainer = decksContent.querySelector(
    ".new-item-options-container"
  );

  const typeSelector = await new SelectFieldRenderer(
    "Type",
    {
      radical: "Radical",
      kanji: "Kanji",
      vocabulary: "Vocabulary",
    },
    "The type of the item you're creating. The input fields depend on what " +
      "you want to make, so choose this first!"
  ).render();

  optionsContainer?.insertBefore(
    typeSelector.getHTML(),
    optionsContainer.firstElementChild!
  );

  const options = decksRoot.querySelector(
    ".new-item-item-options"
  ) as HTMLElement;

  const radicalGroupInstance = await radicalInputFields.render();
  const kanjiGroupInstance = await kanjiInputFields.render();
  const vocabularyGroupInstance = await vocabularyInputFields.render();

  let [getValue, validate]: [() => Record<string, any>, () => boolean] =
    renderInstance(options, radicalGroupInstance);
  let converter: (values: Record<string, any>) => Promise<WKItem> =
    convertToRadical;

  typeSelector.onChange((value) => {
    switch (value) {
      case "radical":
        [getValue, validate] = renderInstance(options, radicalGroupInstance);
        converter = convertToRadical;
        break;
      case "kanji":
        [getValue, validate] = renderInstance(options, kanjiGroupInstance);
        converter = convertToKanji;
        break;
      case "vocabulary":
        [getValue, validate] = renderInstance(options, vocabularyGroupInstance);
        converter = convertToVocabulary;
        break;
    }
  });

  decksRoot
    .querySelector(".new-item-save")
    ?.addEventListener("click", async () => {
      if (!validate()) {
        return;
      }
      const promise = converter(getValue());
      ProgressManager.getInstance().handleProgressEvent(
        promise,
        "Saving item..."
      );
      const item = await promise;
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
