import { createAlert } from "../../components/alert";
import { CustomDeck } from "../../storage/customDeck";
import { SubjectHandler } from "../../storage/wkapi/subject";
import { StorageHandler } from "../../storageHandler";
import { WKItem } from "../../wanikani";

export async function checkForMissingRelated(
  items: string[],
  deck: CustomDeck,
  type: "radical" | "kanji" | "vocabulary"
): Promise<string | undefined> {
  const deckItems = deck.getItems();
  const wanikaniItems = await SubjectHandler.getInstance().fetchItems();

  let missingItems = items.filter(
    (check) =>
      deckItems.find(
        (item) => item.getCharacters() === check && item.type === type
      ) === undefined &&
      wanikaniItems.find(
        (item) => item.characters === check && item.object === type
      ) === undefined
  );

  if (missingItems.length == 0) {
    return undefined;
  }

  const allDecks = await StorageHandler.getInstance().getCustomDecks();
  const allItems = allDecks.flatMap((deck) => deck.getItems());
  const otherDeckItems = missingItems
    .map((check) => {
      const otherItem = allItems.find(
        (item) => item.type === type && item.getCharacters() === check
      );
      return otherItem ? [check, otherItem] : undefined;
    })
    .filter((item) => item !== undefined) as [string, WKItem][];

  if (otherDeckItems.length > 0) {
    await new Promise<void>((resolve) => {
      createAlert({
        title: "Copy Items",
        message:
          "Some related items aren't present in this deck, but they " +
          "are in other decks. Do you want to make an inactivated copy of " +
          "them in this deck?",
        buttons: [
          {
            text: "Cancel",
            style: "secondary",
            handler: () => {
              return true;
            },
          },
          {
            text: "Copy",
            style: "primary",
            handler: async () => {
              missingItems = missingItems.filter(
                (missing) =>
                  otherDeckItems.find((item) => item[0] === missing) ===
                  undefined
              );
              let nextId = await StorageHandler.getInstance().getNewId();
              otherDeckItems.forEach((item) => {
                const deckId = deck.getNextDeckId();
                const newItem = item[1].clone(deckId, nextId);
                newItem.setActive(false);
                deck.addItem(newItem);
                nextId--;
              });
              await StorageHandler.getInstance().swapDeck(deck.getName(), deck);
              return true;
            },
          },
        ],
        afterClosing: () => resolve(),
      });
    });
  }

  if (missingItems.length == 0) {
    return undefined;
  }

  const areOrIs = missingItems.length == 1 ? "is" : "are";
  return `The items "${missingItems.join(
    ", "
  )}" ${areOrIs} not in the deck or on WaniKani`;
}
