import browser from "webextension-polyfill";

browser.storage.local.get().then((result) => {
  if (result.darkMode === false) {
    document.documentElement.classList.remove("dark");
  }
});

document.querySelector(".dark-mode-switcher")?.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  browser.storage.local.set({
    darkMode: document.documentElement.classList.contains("dark"),
  });
  browser.tabs.query({}).then((tabs) => {
    tabs.forEach((tab) => {
      browser.tabs.sendMessage(tab.id!, {
        type: "darkModeSwitch",
      });
    });
  });
});

addScriptRunner(
  document.querySelector(".action-manage-decks")!,
  "src/decks.js"
);
addScriptRunner(document.querySelector(".action-options")!, "src/options.js");

function addScriptRunner(element: HTMLElement, script: string) {
  element.addEventListener("click", () => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      tabs.forEach((tab) => {
        if (tab.id === undefined) {
          return;
        }
        browser.scripting.executeScript({
          target: { tabId: tab.id! },
          files: [script],
        });

        window.close();
      });
    });
  });
}
