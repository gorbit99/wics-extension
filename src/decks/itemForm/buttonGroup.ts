export function setupButtonGroup(buttonGroup: HTMLElement) {
  const buttons = buttonGroup.querySelectorAll(".new-item-button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((button) => button.classList.remove("active"));
      button.classList.add("active");
    });
  });
}
