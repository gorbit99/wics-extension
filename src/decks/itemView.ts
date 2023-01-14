import { createAlert } from "../components/alert";
import { ProgressManager } from "../ProgressManager";
import { CustomDeck } from "../storage/customDeck";
import { StorageHandler } from "../storageHandler";
import { WKItem } from "../wanikani";
import { renderDeckView } from "./deckView";
import itemViewHtml from "./itemView.html?raw";
import { kanjiViewFields } from "./newItem/kanji";
import { radicalViewFields } from "./newItem/radical";
import { vocabularyViewFields } from "./newItem/vocabulary";

export async function renderItemView(
  deck: CustomDeck,
  item: WKItem,
  decksRoot: HTMLElement
) {
  const decksContent = decksRoot.querySelector(".popup-content") as HTMLElement;
  decksContent.innerHTML = itemViewHtml;

  decksRoot.querySelector(".back-button")?.addEventListener("click", () => {
    renderDeckView(deck, decksRoot);
  });

  const viewFields = {
    radical: radicalViewFields,
    kanji: kanjiViewFields,
    vocabulary: vocabularyViewFields,
  }[item.type];

  const itemGroupInstance = await viewFields.render(async (id: string) => {
    const value = item.getValue(id);
    if (id === "kanji" || id == "radicals" || id == "vocabulary") {
      const promise = StorageHandler.getInstance().getAllItemsFromIds(value);
      ProgressManager.getInstance().handleProgressEvent(
        promise,
        "Getting items from the WK server..."
      );
      const items = await promise;
      return items.map((item) => item.getValue("characters"));
    }
    return item.getValue(id);
  });

  const saveButton = decksRoot.querySelector(".item-view-save-button")!;

  itemGroupInstance.onChange(() => {
    saveButton.classList.add("active");
  });

  saveButton.addEventListener("click", async () => {
    if (!itemGroupInstance.validate()) {
      return;
    }
    const value = itemGroupInstance.getValue();
    const promise = item.updateData(value);
    ProgressManager.getInstance().handleProgressEvent(
      promise,
      "Saving item..."
    );
    await promise;
    await StorageHandler.getInstance().updateDeck(deck.getName(), deck);

    saveButton.classList.remove("active");
  });

  const optionsContainer = decksRoot.querySelector(
    ".item-view-specific-data"
  ) as HTMLElement;

  optionsContainer.innerHTML = "";
  optionsContainer.append(...itemGroupInstance.getHTML());

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
