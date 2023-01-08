import { createAlert } from "../components/alert";
import { CustomDeck } from "../storage/customDeck";
import { StorageHandler } from "../storageHandler";
import { WKItem } from "../wanikani";
import { renderDeckList } from "./deckList";
import deckViewHTML from "./deckView.html?raw";
import errors from "./errors";
import { renderItemView } from "./itemView";
import { renderNewItem } from "./newItem";

export function renderDeckView(deck: CustomDeck, decksRoot: HTMLElement) {
  const decksContent = decksRoot.querySelector(".popup-content") as HTMLElement;
  decksContent.innerHTML = deckViewHTML;

  (
    decksContent.querySelectorAll(
      ".deck-view-data-value.editable"
    ) as NodeListOf<HTMLElement>
  ).forEach((elem) => {
    setupEditableField(elem, deck);
  });
  setupBackButton(decksRoot);

  renderItems(deck, decksContent.querySelector(".deck-view-items")!, decksRoot);

  decksRoot
    .querySelector(".deck-view-add-item")
    ?.addEventListener("click", () => renderNewItem(deck, decksRoot));

  decksRoot
    .querySelector(".deck-view-delete-deck")
    ?.addEventListener("click", () => {
      createAlert({
        title: "Delete deck",
        message: `Are you sure you want to delete the deck "${deck.getName()}" and all of its corresponding items?`,
        buttons: [
          {
            text: "Cancel",
            handler: () => true,
            style: "secondary",
          },
          {
            text: "Delete",
            handler: async () => {
              await StorageHandler.getInstance().deleteDeck(deck.getName());
              renderDeckList(decksRoot);
              return true;
            },
            style: "danger",
          },
        ],
      });
    });
}

async function saveEdit(
  editElement: HTMLInputElement,
  errorElement: HTMLElement,
  deck: CustomDeck
) {
  const fieldName = editElement.dataset["field"]!;
  const newValue = editElement.value;
  if (fieldName === "name" && newValue.length == 0) {
    errorElement.textContent = errors.deckNameEmpty;
    return;
  }

  const originalName = deck.getName();

  if (fieldName === "name" && newValue !== originalName) {
    const decks = await StorageHandler.getInstance().getCustomDecks();
    const duplicate = decks.find((deck) => deck.getName() === newValue);
    if (duplicate) {
      errorElement.textContent = errors.deckNameTaken;
      return;
    }
  }

  errorElement.remove();
  const valueElement = document.createElement("span");
  valueElement.classList.add("deck-view-data-value");
  valueElement.classList.add("editable");
  valueElement.dataset["field"] = fieldName;
  editElement.parentElement?.replaceWith(valueElement);

  switch (fieldName) {
    case "name":
      deck.setName(newValue);
      break;
    case "description":
      deck.setDescription(newValue);
      break;
  }

  await StorageHandler.getInstance().updateDeck(originalName, deck);
  setupEditableField(valueElement, deck);
}

function setupBackButton(decksRoot: HTMLElement) {
  const backButton = decksRoot.querySelector(".back-button") as HTMLElement;
  backButton.addEventListener("click", () => {
    renderDeckList(decksRoot);
  });
}

function setupEditableField(elem: HTMLElement, deck: CustomDeck) {
  const fieldName = elem.dataset["field"]!;
  switch (fieldName) {
    case "name":
      elem.textContent = deck.getName();
      break;
    case "description":
      elem.textContent = deck.getDescription();
      break;
  }

  elem.addEventListener("click", () => {
    const originalValue = elem.textContent;
    const inputContainer = document.createElement("div");
    inputContainer.classList.add("deck-view-data-value-container");
    const input = document.createElement("input");
    input.classList.add("deck-view-data-value-input");
    input.value = elem.textContent!;
    input.dataset["field"] = elem.dataset["field"]!;
    const errorElement = document.createElement("span");
    errorElement.classList.add("deck-view-data-value-error");
    inputContainer.append(input, errorElement);
    elem.replaceWith(inputContainer);
    input.focus();
    input.addEventListener("blur", () => {
      saveEdit(input, errorElement, deck);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
      if (e.key === "Escape") {
        input.value = originalValue!;
        input.blur();
      }
    });
  });
}

function renderItems(
  deck: CustomDeck,
  itemList: HTMLElement,
  decksRoot: HTMLElement
) {
  const template = itemList.querySelector(
    ".deck-view-item-template"
  ) as HTMLTemplateElement;
  const filler = itemList.querySelector(".deck-view-item-filler")!;
  deck.getItems().forEach((item) => {
    const itemElement = renderItem(deck, item, template, decksRoot);
    filler.before(itemElement);
  });
}

function renderItem(
  deck: CustomDeck,
  item: WKItem,
  template: HTMLTemplateElement,
  decksRoot: HTMLElement
): HTMLElement {
  const clone = template.content.firstElementChild?.cloneNode(
    true
  ) as HTMLElement;
  clone.querySelector("[data-field='type']")!.textContent = {
    radical: "Rad",
    kanji: "Kan",
    vocabulary: "Voc",
  }[item.type];
  clone.querySelector("[data-field='japanese']")!.textContent =
    item.getCharacters();
  clone.querySelector("[data-field='english']")!.textContent = item
    .getEnglish()
    .join(", ");
  clone.querySelector("[data-field='srsLevel']")!.textContent = item
    .getSrs()
    .srsDataToText();

  clone.addEventListener("click", () => {
    renderItemView(deck, item, decksRoot);
  });

  return clone;
}
