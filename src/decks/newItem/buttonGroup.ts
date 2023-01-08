export function setupButtonGroup(
  buttonGroup: HTMLElement,
  onChange?: (value: string) => void
) {
  const buttons = buttonGroup.querySelectorAll(".item-button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((button) => button.classList.remove("active"));
      button.classList.add("active");
      onChange?.((button as HTMLElement).dataset["value"] ?? "");
    });
  });
}
