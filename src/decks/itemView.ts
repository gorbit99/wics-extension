import { createAlert } from "../components/alert";
import { CustomDeck } from "../storage/customDeck";
import { StorageHandler } from "../storageHandler";
import { FieldValue, WKItem } from "../wanikani";
import { renderDeckView } from "./deckView";
import itemViewHtml from "./itemView.html?raw";
import { renderOptionFields } from "./itemView/options";
import { kanjiFields } from "./newItem/kanji";
import { radicalFields } from "./newItem/radical";
import { vocabularyFields } from "./newItem/vocabulary";

export function renderItemView(
  deck: CustomDeck,
  item: WKItem,
  decksRoot: HTMLElement
) {
  const decksContent = decksRoot.querySelector(".popup-content") as HTMLElement;
  decksContent.innerHTML = itemViewHtml;

  decksRoot.querySelector(".back-button")?.addEventListener("click", () => {
    renderDeckView(deck, decksRoot);
  });

  renderOptionFields(
    decksRoot,
    {
      radical: radicalFields,
      kanji: kanjiFields,
      vocabulary: vocabularyFields,
    }[item.type],
    (id: string) => item.getValue(id),
    (id: string, value: FieldValue) => {
      item.setValue(id, value);
      StorageHandler.getInstance().updateDeck(deck.getName(), deck);
    }
  );

  const typeField = decksRoot.querySelector(
    "[data-field='type']"
  ) as HTMLElement;
  typeField.textContent = {
    radical: "Radical",
    kanji: "Kanji",
    vocabulary: "Vocabulary",
  }[item.type];

  const deleteButton = decksRoot.querySelector(
    ".item-view-delete-button"
  ) as HTMLElement;

  deleteButton.addEventListener("click", () => {
    createAlert({
      title: "Delete item",
      message: `Are you sure you want to delete the item "${item.getCharacters()}"?`,
      buttons: [
        {
          text: "Cancel",
          handler: () => true,
          style: "secondary",
        },
        {
          text: "Delete",
          handler: async () => {
            deck.removeItem(item.getID());
            StorageHandler.getInstance().updateDeck(deck.getName(), deck);
            renderDeckView(deck, decksRoot);
            return true;
          },
          style: "danger",
        },
      ],
    });
  });
}
