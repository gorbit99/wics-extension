export function setupHelpHover(element: HTMLElement, helpText: string) {
  const helpTextElement = document.createElement("div");
  helpTextElement.classList.add("help-hover");
  helpTextElement.textContent = helpText;

  element.addEventListener("mouseover", (event) => {
    element.closest(".popup-root")?.append(helpTextElement);
    const targetRect = (event.target as HTMLElement).getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const helpHoverRect = helpTextElement.getBoundingClientRect();

    if (targetCenterY + helpHoverRect.height > window.innerHeight) {
      helpTextElement.style.bottom = `${window.innerHeight - targetCenterY}px`;
      helpTextElement.style.top = "auto";
    } else {
      helpTextElement.style.top = `${targetCenterY}px`;
      helpTextElement.style.bottom = "auto";
    }
    if (targetCenterX + helpHoverRect.width > window.innerWidth) {
      helpTextElement.style.right = `${window.innerWidth - targetCenterX}px`;
      helpTextElement.style.left = "auto";
    } else {
      helpTextElement.style.left = `${targetCenterX}px`;
      helpTextElement.style.right = "auto";
    }
  });

  element.addEventListener("mouseout", () => {
    helpTextElement.remove();
  });
}
