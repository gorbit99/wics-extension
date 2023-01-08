import browser from "webextension-polyfill";

const jqueryMonkeyPatcher = document.createElement("script");
jqueryMonkeyPatcher.src = browser.runtime.getURL(
  "src/monkeyPatching/jquery.js"
);

document.documentElement.insertBefore(
  jqueryMonkeyPatcher,
  document.documentElement.firstChild
);

const fetchMonkeyPatcher = document.createElement("script");
fetchMonkeyPatcher.src = browser.runtime.getURL("src/monkeyPatching/fetch.js");

document.documentElement.insertBefore(
  fetchMonkeyPatcher,
  document.documentElement.firstChild
);

let itemsToGet = location.href.split("/").pop()?.startsWith("review/session")
  ? ["packs/js/review"]
  : ["packs/js/lesson"];

const mutationObserver = new MutationObserver((mutations) => {
  const addedNotes = mutations.flatMap((mutation) => [...mutation.addedNodes]);
  itemsToGet = itemsToGet.filter((item) => {
    const targetScript = addedNotes.find(
      (node) =>
        node.nodeName === "SCRIPT" &&
        (node as HTMLScriptElement).src.includes(item)
    );

    if (targetScript) {
      const targetScriptElem = targetScript as HTMLScriptElement;
      targetScriptElem.defer = true;
      targetScriptElem.src += "?v=" + Date.now();
      return false;
    }
    return true;
  });

  if (itemsToGet.length === 0) {
    mutationObserver.disconnect();
  }
});
mutationObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

if (location.pathname.startsWith("/lesson/session")) {
  window.addEventListener("load", () => {
    const bodyObserver = new MutationObserver((mutations) => {
      const addedNotes = mutations.flatMap((mutation) => [
        ...mutation.addedNodes,
      ]);

      const batchList = addedNotes.find((node) =>
        (node as HTMLElement).classList.contains("batch-list")
      ) as HTMLElement | undefined;
      if (!batchList) {
        return;
      }

      mutationObserver.disconnect();
      batchList.querySelector("button")?.click();
    });
    bodyObserver.observe(document.querySelector("#lesson")!, {
      childList: true,
      subtree: true,
    });
  });
}
