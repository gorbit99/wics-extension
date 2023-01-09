import decksStyle from "./decks.scss?inline";

import { renderDeckList } from "./decks/deckList";
import { injectPopup } from "./injectedPopup";

injectPopup(decksStyle, "Decks", async (decksRoot) => {
  renderDeckList(decksRoot);
});
