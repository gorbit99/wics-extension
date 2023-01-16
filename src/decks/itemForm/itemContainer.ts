import { setupHelpHover } from "../../components/helpText";

export function createItemContainer(
  title: string,
  helpText?: string
): HTMLElement {
  const container = document.createElement("div");
  container.classList.add("item-option-container");

  const labelContainer = document.createElement("div");
  labelContainer.classList.add("item-option-label-container");

  const label = document.createElement("label");
  label.classList.add("item-option-label");
  label.textContent = title;

  labelContainer.append(label);

  if (helpText) {
    const help = document.createElement("i");
    help.classList.add("fas", "fa-question-circle", "input-help-circle");
    labelContainer.append(help);
    setupHelpHover(help, helpText);
  }

  container.append(labelContainer);
  return container;
}
