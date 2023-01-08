import { BroadSrsLevel, hydrateWKItem } from "../wanikani";
import { WKItem } from "../wanikani/item";

export class CustomDeck {
  private items: WKItem[] = [];
  private description: string = "";

  constructor(private name: string) { }

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
    };

    this.items.forEach((item) => {
      breakdown[item.getSrs().getBroadLevel()]++;
    });

    return breakdown;
  }

  removeItem(id: number) {
    this.items = this.items.filter((item) => item.getID() !== id);
  }
}
