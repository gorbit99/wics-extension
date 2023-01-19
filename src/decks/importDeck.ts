import { createAlert } from "../components/alert";
import { ProgressManager } from "../ProgressManager";
import { CustomDeck } from "../storage/customDeck";
import { StorageHandler } from "../storageHandler";
import { renderDeckList } from "./deckList";
import importDeckHtml from "./importDeck.html?raw";
import { ankiFields, importAnki } from "./importDeck/anki";
import { csvFields, importCsv } from "./importDeck/csv";
import {
  exportedDeckFields,
  importExportedDeck,
} from "./importDeck/exportedDeck";
import { FieldGroupInstance } from "./itemForm/fields";

export async function renderImportDeck(decksRoot: HTMLElement) {
  const deckContent = decksRoot.querySelector(".popup-content") as HTMLElement;
  deckContent.innerHTML = importDeckHtml;

  const formContainer = deckContent.querySelector(
    ".import-deck-option-group"
  ) as HTMLElement;

  let instance: FieldGroupInstance<any, undefined> = await forms.exportedDeck
    .form()
    .render();
  formContainer.append(...instance.getHTML());
  let importer: (values: any) => Promise<CustomDeck> =
    forms.exportedDeck.importer;

  setupFormatButtons(decksRoot, async (selected) => {
    formContainer.innerHTML = "";
    instance = await (await forms[selected].form()).render();
    formContainer.append(...instance.getHTML());
    importer = forms[selected].importer;
  });

  const importButton = deckContent.querySelector(
    ".import-deck-import-button"
  ) as HTMLButtonElement;
  importButton.addEventListener("click", async () => {
    if (!instance.validate(undefined)) {
      return;
    }
    const promise = importer(instance.getValue());
    ProgressManager.getInstance().handleProgressEvent(
      promise,
      "Importing deck..."
    );
    const result = await promise;

    const sameId =
      (await StorageHandler.getInstance().getDeckById(result.getId())) ??
      (await StorageHandler.getInstance().getDeckByName(result.getName()));
    if (sameId) {
      const message = sameId.isMoreRecentThan(result)
        ? "A deck with same ID already exists and it seems more recent. " +
        "Do you want to try to update it, or make a clone?"
        : "There seems to be a deck with the same ID already. " +
        "Do you want to update it or make a clone?";

      createAlert({
        title: "Update Deck",
        message,
        buttons: [
          {
            text: "Cancel",
            handler: () => true,
            style: "secondary",
          },
          {
            text: "Update",
            handler: async () => {
              await StorageHandler.getInstance().updateDeck(result);
              return true;
            },
            style: "primary",
          },
          {
            text: "Clone",
            handler: async () => {
              result.setName(result.getName() + " (clone)");
              result.setId(`${result.getId()} (clone)`);
              await StorageHandler.getInstance().addNewDeck(result);
              return true;
            },
            style: "primary",
          },
        ],
        afterClosing: () => renderDeckList(decksRoot),
      });
      return;
    }

    await StorageHandler.getInstance().addNewDeck(result);
    renderDeckList(decksRoot);
  });

  const backButton = deckContent.querySelector(
    ".back-button"
  ) as HTMLButtonElement;
  backButton.addEventListener("click", () => {
    renderDeckList(decksRoot);
  });
}

const forms = {
  exportedDeck: {
    form: exportedDeckFields,
    importer: importExportedDeck,
  },
  csv: {
    form: csvFields,
    importer: importCsv,
  },
  anki: {
    form: ankiFields,
    importer: importAnki,
  },
};

function setupFormatButtons(
  decksRoot: HTMLElement,
  onSelect: (selected: keyof typeof forms) => void
) {
  const formatButtons = decksRoot.querySelectorAll(".import-deck-format");

  formatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      formatButtons.forEach((button) => button.classList.remove("active"));
      button.classList.add("active");
      onSelect((button as HTMLElement).dataset.format as keyof typeof forms);
    });
  });
}
