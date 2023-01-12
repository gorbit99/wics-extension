import decksStyle from "./decks.scss?inline";

import { renderDeckList } from "./decks/deckList";
import { injectPopup } from "./injectedPopup";
import { renderOOBSetup } from "./oobSetup";
import { getApiToken } from "./storage/wkapi";

injectPopup(decksStyle, "Decks", async (decksRoot) => {
  const apiToken = await getApiToken();
  if (!apiToken) {
    renderOOBSetup(decksRoot);
    return;
  }

  renderDeckList(decksRoot);
});
