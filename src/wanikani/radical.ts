import { StorageHandler } from "../storageHandler";
import { AuxiliaryMeaning, WKRelationship } from "./common";
import { FieldValue, WKItem } from "./item";
import { WKJsonItem, WKLessonItem, WKReviewItem } from "./item/types";
import { WKKanjiItem, WKKanjiRadical } from "./kanji";
import { WKSrsData } from "./srsData";

export class WKRadicalItem extends WKItem {
  constructor(
    id: number,
    english: [string, ...string[]],
    characters: string,
    auxiliaryMeanings: AuxiliaryMeaning[],
    synonyms: string[],
    relationships: WKRelationship,
    meaningMnemonic: string,
    private characterImageUrl: string | null,
    private kanji: number[]
  ) {
    super(
      id,
      "radical",
      english,
      characters,
      relationships,
      synonyms,
      auxiliaryMeanings,
      meaningMnemonic
    );
  }

  async getReviewData(): Promise<WKRadicalReviewItem> {
    return {
      en: this.english,
      id: this.id,
      rad: this.characters,
      type: "Radical",
      category: "Radical",
      characters: this.characters,
      auxiliary_meanings: this.auxiliaryMeanings,
      character_image_url: this.characterImageUrl,
      syn: this.synonyms,
      srs: this.srs.getStage(),
    };
  }

  async getLessonData(): Promise<WKRadicalLessonItem> {
    return {
      en: this.english,
      id: this.id,
      rad: this.characters,
      mmne: this.meaningMnemonic,
      type: "Radical",
      kanji: await this.mapKanji(),
      category: "Radical",
      characters: this.characters,
      auxiliary_meanings: this.auxiliaryMeanings,
      character_image_url: this.characterImageUrl,
      relationships: this.relationships,
    };
  }

  async getJsonData(): Promise<WKRadicalJsonItem> {
    return {
      type: "Radical",
      id: this.id,
      characters: this.characters,
      en: this.english.join(", "),
      stroke: "C",
      meaning_note: this.relationships.study_material?.meaning_note ?? null,
      rad: this.characters,
      mnemonic: this.meaningMnemonic,
    };
  }

  getKanjiRadicalData(): WKKanjiRadical {
    return {
      id: this.id,
      en: this.english[0],
      rad: this.characters,
      slug: this.characters,
      type: "Radical",
      characters: this.characters,
      character_image_url: this.characterImageUrl,
    };
  }

  async mapKanji(): Promise<WKRadicalKanji[]> {
    const kanji = (await StorageHandler.getInstance().getItemsFromIds(
      this.kanji
    )) as WKKanjiItem[];
    return kanji.map((kanji) => kanji.getRadicalKanjiData());
  }

  static hydrate(radical: WKRadicalItem): void {
    Object.setPrototypeOf(radical, WKRadicalItem.prototype);
    WKSrsData.hydrate(radical.srs);
  }

  getValue(id: string): FieldValue {
    switch (id) {
      case "type":
        return "Radical";
      case "characters":
        return this.characters;
      case "character_image_url":
        return this.characterImageUrl;
      case "kanji":
        return this.kanji;
      default:
        return super.getValue(id);
    }
  }

  setValue(id: string, value: FieldValue) {
    switch (id) {
      case "characters":
        this.characters = value as string;
        break;
      case "character_image_url":
        this.characterImageUrl = value as string;
        break;
      case "kanji":
        this.kanji = value as number[];
        break;
      default:
        super.setValue(id, value);
    }
  }
}

interface WKRadicalReviewItem extends WKReviewItem {
  rad: string;
  type: "Radical";
  category: "Radical";
  auxiliary_meanings: AuxiliaryMeaning[];
  character_image_url: string | null;
  syn: string[];
}

interface WKRadicalLessonItem extends WKLessonItem {
  rad: string;
  type: "Radical";
  kanji: WKRadicalKanji[];
  category: "Radical";
  character_image_url: string | null;
}

interface WKRadicalJsonItem extends WKJsonItem {
  type: "Radical";
  rad: string;
  mnemonic: string;
}

export interface WKRadicalKanji {
  en: string;
  ja: string;
  kan: string;
  slug: string;
  type: "Kanji";
  characters: string;
}
