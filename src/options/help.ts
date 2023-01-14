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
};

export function setupHelpElements(optionsRoot: HTMLElement) {
  const helpHoverTemplate = optionsRoot.querySelector(
    ".options-help-hover-template"
  ) as HTMLTemplateElement;

  const helpHover = helpHoverTemplate.content.firstElementChild!.cloneNode(
    true
  ) as HTMLElement;

  optionsRoot.append(helpHover);

  const helpElements = [
    ...optionsRoot.querySelectorAll(".options-input-help"),
  ] as HTMLElement[];

  helpElements.forEach((helpElement) => {
    helpElement.addEventListener("mouseover", (event) => {
      const text =
        helpText[helpElement.dataset["help"] as keyof typeof helpText];
      if (!text) {
        return;
      }

      const targetRect = (event.target as HTMLElement).getBoundingClientRect();
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;

      helpHover.innerHTML = text;
      helpHover.style.display = "block";

      const helpHoverRect = helpHover.getBoundingClientRect();

      if (targetCenterY + helpHoverRect.height > window.innerHeight) {
        helpHover.style.bottom = `${window.innerHeight - targetCenterY}px`;
        helpHover.style.top = "auto";
      } else {
        helpHover.style.top = `${targetCenterY}px`;
        helpHover.style.bottom = "auto";
      }
      if (targetCenterX + helpHoverRect.width > window.innerWidth) {
        helpHover.style.right = `${window.innerWidth - targetCenterX}px`;
        helpHover.style.left = "auto";
      } else {
        helpHover.style.left = `${targetCenterX}px`;
        helpHover.style.right = "auto";
      }
    });

    helpElement.addEventListener("mouseout", () => {
      helpHover.style.display = "none";
    });
  });
}
