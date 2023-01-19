import { CustomDeck } from "../storage/customDeck";
import { StorageHandler } from "../storageHandler";
import { AuxiliaryMeaning, WKRelationship } from "./common";
import {
  WKExportItem,
  WKJsonItem,
  WKLessonItem,
  WKReviewItem,
} from "./item/types";
import { WKSrsData } from "./srsData";

export abstract class WKItem {
  protected srs: WKSrsData;
  private active = true;

  constructor(
    protected id: number,
    protected deckId: number,
    public type: "radical" | "kanji" | "vocabulary",
    protected english: [string, ...string[]],
    protected characters: string,
    protected relationships: WKRelationship,
    protected auxiliaryMeanings: AuxiliaryMeaning[],
    protected meaningMnemonic: string
  ) {
    this.id = id;
    this.type = type;
    this.english = english;
    this.characters = characters;
    this.relationships = relationships;
    this.auxiliaryMeanings = auxiliaryMeanings;

    this.srs = new WKSrsData();
  }

  abstract getReviewData(parent: CustomDeck): Promise<WKReviewItem>;
  abstract getLessonData(parent: CustomDeck): Promise<WKLessonItem>;
  abstract getJsonData(): Promise<WKJsonItem>;
  abstract getExportData(): WKExportItem;

  protected getBaseExportData(): WKExportItem {
    return {
      deckId: this.deckId,
      type: {
        radical: "rad" as const,
        kanji: "kan" as const,
        vocabulary: "voc" as const,
      }[this.type],
      english: this.english,
      characters: this.characters,
      auxiliaryMeanings: this.auxiliaryMeanings,
      meaningMnemonic: this.meaningMnemonic,
    };
  }

  isPendingReview(): boolean {
    return this.isReview() && this.srs.isPending();
  }

  getID(): number {
    return this.id;
  }

  getDeckId(): number {
    return this.deckId;
  }

  setDeckId(deckId: number) {
    this.deckId = deckId;
  }

  isReview(): boolean {
    return this.isActive() && this.srs.isReview();
  }

  isLesson(): boolean {
    return this.isActive() && this.srs.isLesson();
  }

  review(mistakes: number) {
    this.srs.review(mistakes);
  }

  isBurned(): boolean {
    return this.srs.isBurned();
  }

  getCharacters(): string {
    return this.characters;
  }

  getEnglish(): string[] {
    return this.english;
  }

  getSrs(): WKSrsData {
    return this.srs;
  }

  getReadings(): string[] | undefined {
    return undefined;
  }

  isActive(): boolean {
    return this.active ?? true;
  }

  setActive(active: boolean) {
    this.active = active;
  }

  async updateData(data: Record<string, any>): Promise<void> {
    for (const key in data) {
      if (key === "radicals") {
        const ids = await StorageHandler.getInstance().radicalsToIds(data[key]);
        this.setValue(key, ids);
        continue;
      }
      if (key === "kanji") {
        const ids = await StorageHandler.getInstance().kanjiToIds(data[key]);
        this.setValue(key, ids);
        continue;
      }
      if (key === "vocabulary") {
        const ids = await StorageHandler.getInstance().vocabularyToIds(
          data[key]
        );
        this.setValue(key, ids);
        continue;
      }
      this.setValue(key, data[key]);
    }
  }

  updateFromItem(item: WKItem) {
    this.english = item.english;
    this.characters = item.characters;
    this.relationships = item.relationships;
    this.auxiliaryMeanings = item.auxiliaryMeanings;
    this.meaningMnemonic = item.meaningMnemonic;
  }

  getValue(id: string): any {
    switch (id) {
      case "id":
        return this.id;
      case "type":
        return this.type;
      case "english":
        return this.english;
      case "characters":
        return this.characters;
      case "relationships":
        return this.relationships;
      case "auxiliaryMeanings":
        return this.auxiliaryMeanings;
      case "meaningMnemonic":
        return this.meaningMnemonic;
      case "srs":
        return this.srs.getStage();
      default:
        throw new Error(`Invalid field id: ${id}`);
    }
  }

  setValue(id: string, value: any) {
    switch (id) {
      case "english":
        this.english = value as [string, ...string[]];
        break;
      case "characters":
        this.characters = value as string;
        break;
      case "relationships":
        this.relationships = value as WKRelationship;
        break;
      case "auxiliaryMeanings":
        this.auxiliaryMeanings = value as AuxiliaryMeaning[];
        break;
      case "meaningMnemonic":
        this.meaningMnemonic = value as string;
        break;
      default:
        throw new Error(`Invalid field id: ${id}`);
    }
  }

  completeLesson() {
    this.srs.review(0);
  }

  abstract clone(deckId: number, id: number): WKItem;

  abstract removeRelated(deckId: number): void;

  abstract fixUpRelated(deck: CustomDeck): void;
}
