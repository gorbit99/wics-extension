import { AuxiliaryMeaning, WKRelationship } from "./common";
import { WKJsonItem, WKLessonItem, WKReviewItem } from "./item/types";
import { WKSrsData } from "./srsData";

export abstract class WKItem {
  protected srs: WKSrsData;

  constructor(
    protected id: number,
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

  abstract getReviewData(): Promise<WKReviewItem>;
  abstract getLessonData(): Promise<WKLessonItem>;
  abstract getJsonData(): Promise<WKJsonItem>;

  isPendingReview(): boolean {
    return this.isReview() && this.srs.isPending();
  }

  getID(): number {
    return this.id;
  }

  isReview(): boolean {
    return this.srs.isReview();
  }

  isLesson(): boolean {
    return this.srs.isLesson();
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

  updateData(data: Record<string, any>): void {
    for (const key in data) {
      this.setValue(key, data[key]);
    }
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
}
