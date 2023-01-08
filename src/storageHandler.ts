import { CustomDeck } from "./storage/customDeck";
import browser from "webextension-polyfill";
import { WKItem, WKJsonItem, WKLessonItem, WKReviewItem } from "./wanikani";

export class StorageHandler {
  private static instance: StorageHandler;

  private constructor() {}

  static getInstance(): StorageHandler {
    if (!StorageHandler.instance) {
      StorageHandler.instance = new StorageHandler();
    }
    return StorageHandler.instance;
  }

  async getCustomDecks(): Promise<CustomDeck[]> {
    const database = await browser.storage.local.get();
    const decks = database.customDecks ?? [];
    decks.forEach((deck: CustomDeck) => {
      CustomDeck.hydrate(deck);
    });
    return decks;
  }

  async addNewDeck(deck: CustomDeck): Promise<void> {
    const decks = await this.getCustomDecks();
    decks.push(deck);
    await browser.storage.local.set({ customDecks: decks });
  }

  async getPendingReviewIds(): Promise<number[]> {
    const decks = await this.getCustomDecks();
    return decks
      .flatMap((deck) => deck.getItems())
      .filter((item) => item.isPendingReview())
      .map((item) => item.getID());
  }

  async getPendingLessons(): Promise<WKLessonItem[]> {
    const decks = await this.getCustomDecks();
    return Promise.all(
      decks.flatMap((deck) => {
        return deck
          .getItems()
          .filter((item) => item.isLesson())
          .map((item) => item.getLessonData());
      })
    );
  }

  async getReviewItemData(items: number[]): Promise<WKReviewItem[]> {
    console.log(items);
    const decks = await this.getCustomDecks();
    return Promise.all(
      decks
        .flatMap((deck) => deck.getItems())
        .filter((item) => items.includes(item.getID()))
        .map((item) => item.getReviewData())
    );
  }

  async getItemsFromIds(ids: number[]): Promise<WKItem[]> {
    const decks = await this.getCustomDecks();
    return ids
      .map((id) => {
        const item = decks.find((deck) => deck.getItem(id))?.getItem(id);
        if (!item) {
          return undefined;
        }
        return item;
      })
      .filter((item) => item !== undefined) as WKItem[];
  }

  async radicalsToIds(radicals: string[]): Promise<number[]> {
    // TODO: implement
    return [];
  }

  async kanjiToIds(kanji: string[]): Promise<number[]> {
    // TODO: implement
    return [];
  }

  async vocabularyToIds(vocabulary: string[]): Promise<number[]> {
    // TODO: implement
    return [];
  }

  async getDeckByName(name: string): Promise<CustomDeck | undefined> {
    const decks = await this.getCustomDecks();
    return decks.find((deck) => deck.getName() === name);
  }

  async updateDeck(originalName: string, value: CustomDeck): Promise<void> {
    const decks = await this.getCustomDecks();
    const index = decks.findIndex((deck) => deck.getName() === originalName);
    decks[index] = value;
    await browser.storage.local.set({ customDecks: decks });
  }

  async getNewId(): Promise<number> {
    const items = await this.getCustomDecks().then((decks) =>
      decks.flatMap((deck) => deck.getItems())
    );
    const ids = items.map((item) => item.getID());
    if (ids.length === 0) {
      return -1;
    }
    return Math.min(...ids) - 1;
  }

  async deleteDeck(name: string): Promise<void> {
    const decks = await this.getCustomDecks();
    const index = decks.findIndex((deck) => deck.getName() === name);
    decks.splice(index, 1);
    await browser.storage.local.set({ customDecks: decks });
  }

  async handleLessonCompletion(items: number[]) {
    const decks = await this.getCustomDecks();
    decks.forEach((deck) => {
      items = items.filter((item) => {
        const deckItem = deck.getItem(item);
        if (!deckItem) {
          return true;
        }
        deckItem.completeLesson();
        this.updateDeck(deck.getName(), deck);
        return false;
      });
    });
    await browser.storage.local.set({ customDecks: decks });
  }

  async handleProgressMade(result: Record<number, [number, number]>) {
    const decks = await this.getCustomDecks();
    let entries = Object.entries(result);
    decks.forEach((deck) => {
      entries = entries.filter((entry) => {
        const deckItem = deck.getItem(parseInt(entry[0]));
        console.log(deckItem, "Hello");
        if (!deckItem) {
          return true;
        }
        deckItem.review(entry[1][0] + entry[1][1]);
        this.updateDeck(deck.getName(), deck);
        return false;
      });
    });
    await browser.storage.local.set({ customDecks: decks });
  }

  async getItemJson(id: number): Promise<WKJsonItem | undefined> {
    const item = (await this.getItemsFromIds([id]))[0];
    return item?.getJsonData();
  }
}
