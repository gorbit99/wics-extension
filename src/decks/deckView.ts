import JSZip from "jszip";
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
      ".deck-view-data-value"
    ) as NodeListOf<HTMLElement>
  ).forEach((elem) => {
    setupEditableField(elem, deck);
  });
  setupBackButton(decksRoot);

  decksRoot
    .querySelector(".deck-view-add-item")
    ?.addEventListener("click", () => renderNewItem(deck, decksRoot));

  decksRoot
    .querySelector(".deck-view-export-deck")
    ?.addEventListener("click", () => exportDeck(deck));

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

  handlePaginationSetup(decksRoot, deck);
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
    case "author":
      elem.textContent = deck.getAuthor();
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
  items: WKItem[],
  decksRoot: HTMLElement,
  from: number = 0,
  pageSize: number = 100
) {
  const itemList = decksRoot.querySelector(".deck-view-items")!;
  const template = itemList.querySelector(
    ".deck-view-item-template"
  ) as HTMLTemplateElement;
  const filler = itemList.querySelector(".deck-view-item-filler")!;
  itemList.innerHTML = "";
  itemList.append(template);
  items.slice(from, from + pageSize).forEach((item) => {
    const itemElement = renderItem(deck, item, template, decksRoot);
    itemList.append(itemElement);
  });
  itemList.append(filler);
}

const paginationContext = 2;

function handlePaginationSetup(decksRoot: HTMLElement, deck: CustomDeck) {
  let itemCount = deck.getItems().length;
  let perPage = 100;
  let pageCount = Math.ceil(itemCount / perPage);
  let filter = "";
  let items = deck.getItems();

  const paginationButtons = decksRoot.querySelector(
    ".deck-view-pagination-buttons"
  ) as HTMLElement;

  const firstButton = paginationButtons.querySelector(
    "[data-page='first']"
  ) as HTMLButtonElement;
  const prevButton = paginationButtons.querySelector(
    "[data-page='prev']"
  ) as HTMLButtonElement;
  const nextButton = paginationButtons.querySelector(
    "[data-page='next']"
  ) as HTMLButtonElement;
  const lastButton = paginationButtons.querySelector(
    "[data-page='last']"
  ) as HTMLButtonElement;

  let currentPage = 1;

  const filterInput = decksRoot.querySelector(
    ".deck-view-search-input"
  ) as HTMLInputElement;

  filterInput.addEventListener("change", () => {
    console.log(filterInput.value);
    filter = filterInput.value;

    items = deck
      .getItems()
      .filter(
        (item) =>
          item.getCharacters().includes(filter) ||
          item.getEnglish().find((english) => english.includes(filter)) ||
          item.type.includes(filter) ||
          item.getSrs().getBroadLevel().includes(filter) ||
          item.getReadings()?.find((reading) => reading.includes(filter))
      );

    switchToPage(1);
  });

  firstButton.addEventListener("click", () => switchToPage(1));
  prevButton.addEventListener("click", () => switchToPage(currentPage - 1));
  nextButton.addEventListener("click", () => switchToPage(currentPage + 1));
  lastButton.addEventListener("click", () => switchToPage(pageCount));

  const infoCount = decksRoot.querySelector(
    ".deck-view-pagination-info-count"
  ) as HTMLElement;

  const perPageInput = decksRoot.querySelector(
    ".deck-view-pagination-per-page"
  ) as HTMLInputElement;
  perPageInput.value = perPage.toString();

  perPageInput.addEventListener("change", () => {
    perPage = Math.max(1, parseInt(perPageInput.value) ?? 100);
    perPageInput.value = perPage.toString();
    switchToPage(1);
  });

  const renderButtons = () => {
    const buttons = createPaginationButtons(
      currentPage,
      pageCount,
      switchToPage
    );

    paginationButtons.innerHTML = "";
    paginationButtons.append(
      firstButton,
      prevButton,
      ...buttons,
      nextButton,
      lastButton
    );
  };

  const switchToPage = (page: number) => {
    itemCount = items.length;
    pageCount = Math.ceil(itemCount / perPage);
    currentPage = page;
    renderButtons();

    firstButton.disabled = currentPage === 1;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === pageCount;
    lastButton.disabled = currentPage === pageCount;

    infoCount.textContent = `${(currentPage - 1) * perPage + 1} - ${Math.min(
      currentPage * perPage,
      itemCount
    )} of ${itemCount}`;

    renderItems(deck, items, decksRoot, perPage * (currentPage - 1), perPage);
  };

  switchToPage(1);
}

function createPaginationButtons(
  currentPage: number,
  lastPage: number,
  onClick: (page: number) => void
): HTMLElement[] {
  const falseLast = Math.min(lastPage, currentPage + paginationContext);
  const firstButton = Math.max(1, falseLast - paginationContext * 2);
  const lastButton = Math.min(lastPage, firstButton + paginationContext * 2);

  return new Array(lastButton - firstButton + 1).fill(0).map((_, i) => {
    const button = createPaginationButton(firstButton + i, onClick);
    if (firstButton + i === currentPage) {
      button.classList.add("active");
    }
    return button;
  });
}

function createPaginationButton(
  page: number,
  onClick: (page: number) => void
): HTMLElement {
  const button = document.createElement("button");
  button.classList.add("deck-view-pagination-button", "button");
  button.addEventListener("click", () => onClick(page));
  button.textContent = page.toString();
  return button;
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

async function exportDeck(deck: CustomDeck) {
  const data = JSON.stringify(await deck.getExportData());
  const zip = new JSZip();
  zip.file("deck.json", data);
  zip
    .generateAsync({ type: "blob", compression: "DEFLATE" })
    .then((content) => {
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      document.body.appendChild(link);
      link.download = `${deck.getName()}.deck`;
      link.click();
      link.remove();
    });
}
