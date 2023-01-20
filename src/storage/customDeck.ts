import { Config } from "../config";
import { StorageHandler } from "../storageHandler";
import {
  BroadSrsLevel,
  hydrateWKItem,
  WKKanjiExportItem,
  WKKanjiItem,
  WKRadicalExportItem,
  WKRadicalItem,
  WKVocabularyExportItem,
  WKVocabularyItem,
} from "../wanikani";
import { fromSubject } from "../wanikani/fromSubject";
import { WKItem } from "../wanikani/item";
import { WKExportItem } from "../wanikani/item/types";
import { SubjectHandler } from "./wkapi/subject";
import { fetchUser } from "./wkapi/user";

export class CustomDeck {
  private items: WKItem[] = [];
  private description: string = "";
  private currentLevel = 1;

  constructor(
    private name: string,
    private author: string,
    private deckId: string = "",
    private lastUpdated: number = new Date().getTime()
  ) {
    if (deckId === "") {
      this.deckId = `${author}.${name}`;
    }
  }

  getId(): string {
    return this.deckId;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string) {
    this.name = name;
  }

  getLevel(): number {
    return this.currentLevel;
  }

  setId(id: string) {
    this.deckId = id;
  }

  getDescription(): string {
    return this.description;
  }

  setDescription(description: string) {
    this.description = description;
  }

  getAuthor(): string {
    return this.author;
  }

  getItems(): WKItem[] {
    return this.items;
  }

  getItem(id: number): WKItem | undefined {
    return this.items.find((item) => item.getID() === id);
  }

  getItemByDeckId(deckId: number): WKItem | undefined {
    return this.items.find((item) => item.getDeckId() === deckId);
  }

  static hydrate(deck: CustomDeck) {
    Object.setPrototypeOf(deck, CustomDeck.prototype);
    deck.items.forEach((item) => {
      hydrateWKItem(item);
    });
    if (deck.getLevel() === undefined) {
      deck.currentLevel = 1;
    }
    if (deck.author === undefined) {
      this.fixDeckAuthor(deck);
    }
    if (deck.getItems().some((item) => item.getDeckId() === undefined)) {
      this.fixDeckId(deck);
      deck.getItems().forEach((item) => item.fixUpRelated(deck));
    }

    deck.items.forEach((item) => {
      if (item.getSrs().getLevel() === undefined) {
        item.getSrs().setLevel(1);
      }
    });
  }

  getMaxLevel(): number {
    return this.getItems().reduce(
      (max, item) => Math.max(max, item.getSrs().getLevel()),
      0
    );
  }

  private static async fixDeckAuthor(deck: CustomDeck) {
    const user = await fetchUser();
    deck.author = user.username;
    await StorageHandler.getInstance().swapDeck(deck.name, deck);
  }

  private static async fixDeckId(deck: CustomDeck) {
    deck.items.forEach((item, i) => {
      item.setDeckId(-i - 1);
    });
    await StorageHandler.getInstance().swapDeck(deck.name, deck);
  }

  addItem(item: WKItem) {
    this.items.push(item);
  }

  updateItem(item: WKItem) {
    const index = this.items.findIndex((i) => i.getID() === item.getID());
    if (index !== -1) {
      this.items[index] = item;
    }
  }

  generateLevelBreakdown(): Record<BroadSrsLevel, number> {
    const breakdown: Record<BroadSrsLevel, number> = {
      lesson: 0,
      apprentice: 0,
      guru: 0,
      master: 0,
      enlightened: 0,
      burned: 0,
      locked: 0,
    };

    this.items.forEach((item) => {
      if (!item.isActive()) {
        return;
      }
      breakdown[item.getSrs().getBroadLevel()]++;
    });

    return breakdown;
  }

  removeItem(id: number) {
    const item = this.getItem(id);
    if (!item) {
      return;
    }
    this.items = this.items.filter((item) => item.getID() !== id);

    this.items.forEach((item) => item.removeRelated(item.getDeckId()));
  }

  getExportData(): CustomDeckExportData {
    return {
      exportDate: new Date().getTime(),
      name: this.name,
      author: this.author,
      deckId: `${this.getAuthor()}.${this.getName()}`,
      description: this.description,
      items: this.items.map((item) => item.getExportData()),
    };
  }

  static async fromExportData(data: CustomDeckExportData): Promise<CustomDeck> {
    const deck = new CustomDeck(
      data.name,
      data.author,
      data.deckId,
      data.exportDate
    );
    deck.setDescription(data.description);
    await SubjectHandler.getInstance().fetchItems();
    const nextId = await StorageHandler.getInstance().getNewId();

    deck.items = data.items.map((item, id) => {
      switch (item.type) {
        case "rad":
          return WKRadicalItem.fromExportData(
            nextId + id,
            item as WKRadicalExportItem
          );
        case "kan":
          return WKKanjiItem.fromExportData(
            nextId + id,
            item as WKKanjiExportItem
          );
        case "voc":
          return WKVocabularyItem.fromExportData(
            nextId + id,
            item as WKVocabularyExportItem
          );
      }
    });
    return deck;
  }

  async updateFromDeck(deck: CustomDeck) {
    this.description = deck.description;
    this.lastUpdated = deck.lastUpdated;
    deck.items.forEach((item) => {
      const existingItem = this.getItems().find(
        (other) => item.getDeckId() === other.getDeckId()
      );
      if (existingItem) {
        existingItem.updateFromItem(item);
      } else {
        this.addItem(item);
      }
    });

    const missingItemHandling = (await Config.getInstance().getConfig())
      .updateMissingItemHandling;

    if (missingItemHandling === "delete") {
      this.items = this.items.filter((item) =>
        deck.items.some((other) => other.getDeckId() === item.getDeckId())
      );
    }
  }

  isMoreRecentThan(deck: CustomDeck): boolean {
    return this.lastUpdated > deck.lastUpdated;
  }

  getNextDeckId(): number {
    return this.items.reduce((acc, item) => Math.min(acc, item.getID()), 0) - 1;
  }

  async mapRelatedItems(items: number[]): Promise<WKItem[]> {
    const customIds = items.filter((id) => id < 0);
    const wkIds = items.filter((id) => id > 0);
    const customItems = customIds.map((id) => this.getItemByDeckId(id)!);
    const wkItems = (await SubjectHandler.getInstance().fetchItems(wkIds)).map(
      (item) => fromSubject(item)
    );
    return [...customItems, ...wkItems];
  }

  getPendingReviewItems(): WKItem[] {
    return this.items.filter((item) => item.isPendingReview(this.currentLevel));
  }

  getLessons(): WKItem[] {
    return this.items.filter((item) => item.isLesson(this.currentLevel));
  }

  updateDeckLevel() {
    const completionRequirement = 0.9;

    const maxLevel = this.getMaxLevel();

    if (this.currentLevel > maxLevel) {
      return;
    }

    while (true) {
      const levelKanji = this.items.filter(
        (item) =>
          item.getSrs().getLevel() == this.currentLevel && item.type === "kanji"
      );

      if (levelKanji.length === 0) {
        this.currentLevel++;
        continue;
      }

      const completed = levelKanji.filter((item) =>
        item.getSrs().isPassed()
      ).length;

      if (completed / levelKanji.length < completionRequirement) {
        break;
      }
      this.currentLevel++;

      if (this.currentLevel > maxLevel) {
        break;
      }
    }
  }
}

export interface CustomDeckExportData {
  exportDate: number;
  name: string;
  author: string;
  description: string;
  deckId: string;
  items: WKExportItem[];
}
