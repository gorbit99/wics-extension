import { CustomDeck } from "./storage/customDeck";
import browser from "webextension-polyfill";
import { WKItem } from "./wanikani";
import { WKJsonItem, WKLessonItem, WKReviewItem } from "./wanikani/item/types";
import { fetchSubjects } from "./storage/wkapi";
import { fromSubject } from "./wanikani/fromSubject";

export class StorageHandler {
  private static instance: StorageHandler;

  private constructor() {}

  static getInstance(): StorageHandler {
    if (!StorageHandler.instance) {
      StorageHandler.instance = new StorageHandler();
    }
    return StorageHandler.instance;
  }

  private customDeckCache: Map<string, CustomDeck> = new Map();

  async getCustomDecks(): Promise<CustomDeck[]> {
    const database = await browser.storage.local.get("customDecks");
    const decks = database.customDecks ?? [];
    decks.forEach((deck: CustomDeck) => {
      CustomDeck.hydrate(deck);
    });
    decks.forEach((deck: CustomDeck) => {
      this.customDeckCache.set(deck.getName(), deck);
    });
    return decks;
  }

  async addNewDeck(deck: CustomDeck): Promise<void> {
    const decks = await this.getCustomDecks();
    decks.push(deck);
    this.customDeckCache.set(deck.getName(), deck);
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

  async getAllItemsFromIds(ids: number[]): Promise<WKItem[]> {
    const wanikaniSubjects = await fetchSubjects(ids);

    const wkItems = await Promise.all(
      wanikaniSubjects.map((subject) => fromSubject(subject))
    );

    const customItems = await this.getItemsFromIds(ids);

    return wkItems.concat(customItems);
  }

  async radicalsToIds(radicals: string[]): Promise<number[]> {
    const wanikaniIds = (await fetchSubjects())
      // TODO: handle image radicals
      .filter(
        (item) =>
          item.object === "radical" && radicals.includes(item.characters!)
      )
      .map((item) => item.id);
    const decks = await this.getCustomDecks();
    const customIds = decks
      .flatMap((deck) => deck.getItems())
      .filter(
        (item) =>
          item.type === "radical" && radicals.includes(item.getCharacters())
      )
      .map((item) => item.getID());

    return wanikaniIds.concat(customIds);
  }

  async kanjiToIds(kanji: string[]): Promise<number[]> {
    const wanikaniIds = (await fetchSubjects())
      .filter((item) => item.object === "kanji" && kanji.includes(item.slug))
      .map((item) => item.id);
    const decks = await this.getCustomDecks();
    const customIds = decks
      .flatMap((deck) => deck.getItems())
      .filter(
        (item) => item.type === "kanji" && kanji.includes(item.getCharacters())
      )
      .map((item) => item.getID());

    return wanikaniIds.concat(customIds);
  }

  async vocabularyToIds(vocabulary: string[]): Promise<number[]> {
    const wanikaniIds = (await fetchSubjects())
      .filter(
        (item) => item.object === "vocabulary" && vocabulary.includes(item.slug)
      )
      .map((item) => item.id);
    const decks = await this.getCustomDecks();
    const customIds = decks
      .flatMap((deck) => deck.getItems())
      .filter(
        (item) =>
          item.type === "vocabulary" &&
          vocabulary.includes(item.getCharacters())
      )
      .map((item) => item.getID());

    return wanikaniIds.concat(customIds);
  }

  async getDeckByName(name: string): Promise<CustomDeck | undefined> {
    if (this.customDeckCache.has(name)) {
      return this.customDeckCache.get(name);
    }
    const decks = await this.getCustomDecks();
    return decks.find((deck) => deck.getName() === name);
  }

  async updateDeck(originalName: string, value: CustomDeck): Promise<void> {
    const decks = await this.getCustomDecks();
    const index = decks.findIndex((deck) => deck.getName() === originalName);
    decks[index] = value;
    this.customDeckCache.set(value.getName(), value);
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
    this.customDeckCache.delete(name);
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
