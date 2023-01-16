import { setupHelpHover } from "../components/helpText";

const helpText = {
  lessonPlacement:
    "Where the lessons get placed in the queue. Back places the lessons at " +
    "the end. Front causes them to appear first. Random means the lessons are " +
    "placed at random positions in the queue.",
  reviewPlacement:
    "Where the reviews get placed in the queue. Back places the reviews at " +
    "the end. Front causes them to appear first. Random means the reviews are " +
    "placed at random positions in the queue.",
  resetApiKey:
    "Removes the API key you've set up when you first used the extension. " +
    "This will cause you to have to re-enter your API key when you next " +
    "open the decks panel.",
  removeAllDecks:
    "Removes all of the decks from your setup, including the items within.",
  clearBrowserStorage:
    "Clears all the data stored in your browser by this extensions. This " +
    "includes the API key, decks, and cached WK data.",
  csvImportFieldStyle:
    "The method with which the example fields will be displayed when " +
    "importing a CSV or Anki deck. Field Name will display a few examples " +
    "as the name of the field, while the Hover Text options display a " +
    "generic field name, and put more examples into a hover text, separated " +
    "by their specified character.",
};

export function setupHelpElements(optionsRoot: HTMLElement) {
  const helpElements = [
    ...optionsRoot.querySelectorAll(".input-help-circle"),
  ] as HTMLElement[];

  helpElements.forEach((helpElement) => {
    const text = helpText[helpElement.dataset["help"] as keyof typeof helpText];
    if (!text) {
      return;
    }
    setupHelpHover(helpElement, text);
  });
}
