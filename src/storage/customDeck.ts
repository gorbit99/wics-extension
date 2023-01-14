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
import { WKItem } from "../wanikani/item";
import { WKExportItem } from "../wanikani/item/types";
import { fetchUser } from "./wkapi/user";

export class CustomDeck {
  private items: WKItem[] = [];
  private description: string = "";

  constructor(
    private name: string,
    private author: string,
    private deckId: string = "",
    private lastUpdated: number = new Date().getTime()
  ) { }

  getName(): string {
    return this.name;
  }

  setName(name: string) {
    this.name = name;
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

  static hydrate(deck: CustomDeck) {
    Object.setPrototypeOf(deck, CustomDeck.prototype);
    deck.items.forEach((item) => {
      hydrateWKItem(item);
    });
    if (deck.author === undefined) {
      this.fixDeckAuthor(deck);
    }
  }

  private static async fixDeckAuthor(deck: CustomDeck) {
    const user = await fetchUser();
    deck.author = user.username;
    StorageHandler.getInstance().updateDeck(deck.name, deck);
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
      breakdown[item.getSrs().getBroadLevel()]++;
    });

    return breakdown;
  }

  removeItem(id: number) {
    this.items = this.items.filter((item) => item.getID() !== id);
  }

  async getExportData(): Promise<CustomDeckExportData> {
    return {
      exportDate: new Date().getTime(),
      name: this.name,
      author: this.author,
      deckId: `${this.getAuthor()}.${this.getName()}`,
      description: this.description,
      items: await Promise.all(
        this.items.map(async (item) => item.getExportData())
      ),
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
    const nextId = await StorageHandler.getInstance().getNewId();
    deck.items = await Promise.all(
      data.items.map(async (item, id) => {
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
      })
    );
    return deck;
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
