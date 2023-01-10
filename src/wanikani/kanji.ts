import { WKSrsData } from ".";
import { StorageHandler } from "../storageHandler";
import { AuxiliaryMeaning, AuxiliaryReading, WKRelationship } from "./common";
import { FieldValue, WKItem } from "./item";
import { WKJsonItem, WKLessonItem, WKReviewItem } from "./item/types";
import { WKRadicalItem, WKRadicalKanji } from "./radical";
import { WKVocabularyItem, WKVocabularyKanji } from "./vocabulary";

export class WKKanjiItem extends WKItem {
  constructor(
    id: number,
    english: [string, ...string[]],
    characters: string,
    private onyomi: string[],
    private kunyomi: string[],
    private nanori: string[],
    private emphasis: "onyomi" | "kunyomi" | "nanori",
    meaningMnemonic: string,
    private meaningHint: string,
    private readingMnemonic: string,
    private readingHint: string,
    synonyms: string[],
    private radicals: number[],
    private vocabulary: number[],
    auxiliaryMeanings: AuxiliaryMeaning[],
    private auxiliaryReadings: AuxiliaryReading[],
    relationships: WKRelationship
  ) {
    super(
      id,
      "kanji",
      english,
      characters,
      relationships,
      synonyms,
      auxiliaryMeanings,
      meaningMnemonic
    );
  }

  async getReviewData(): Promise<WKKanjiReviewItem> {
    return {
      id: this.id,
      en: this.english,
      type: "Kanji",
      category: "Kanji",
      characters: this.characters,
      on: this.onyomi,
      kun: this.kunyomi,
      nanori: this.nanori,
      srs: this.srs.getStage(),
      kan: this.characters,
      emph: this.emphasis,
      auxiliary_meanings: this.auxiliaryMeanings,
      auxiliary_readings: this.auxiliaryReadings,
      syn: this.synonyms,
    };
  }

  async getLessonData(): Promise<WKKanjiLessonItem> {
    return {
      id: this.id,
      en: this.english,
      on: this.onyomi,
      kun: this.kunyomi,
      nanori: this.nanori,
      kan: this.characters,
      characters: this.characters,
      emph: this.emphasis,
      rhnt: this.readingHint,
      rmne: this.readingMnemonic,
      mhnt: this.meaningHint,
      mmne: this.meaningMnemonic,
      type: "Kanji",
      category: "Kanji",
      radicals: await this.mapRadicals(),
      vocabulary: await this.mapVocabulary(),
      auxiliary_meanings: this.auxiliaryMeanings,
      auxiliary_readings: this.auxiliaryReadings,
      relationships: this.relationships,
    };
  }

  async getJsonData(): Promise<WKKanjiJsonItem> {
    return {
      type: "Kanji",
      id: this.id,
      characters: this.characters,
      en: this.english.join(", "),
      stroke: "C",
      meaning_note: this.relationships.study_material?.meaning_note ?? null,
      kan: this.characters,
      meaning_mnemonic: this.meaningMnemonic,
      meaning_hint: this.meaningHint,
      reading_mnemonic: this.readingMnemonic,
      reading_hint: this.readingHint,
      reading_note: this.relationships.study_material?.reading_note ?? null,
      // TODO: related
      related: [],
    };
  }

  getRadicalKanjiData(): WKRadicalKanji {
    return {
      en: this.english[0],
      ja: this.characters,
      kan: this.characters,
      slug: this.characters,
      type: "Kanji",
      characters: this.characters,
    };
  }

  getVocabKanjiData(): WKVocabularyKanji {
    return {
      en: this.english[0],
      id: this.id,
      ja: this.characters,
      kan: this.characters,
      type: "Kanji",
      characters: this.characters,
    };
  }

  async mapRadicals(): Promise<WKKanjiRadical[]> {
    const radicals = (await StorageHandler.getInstance().getItemsFromIds(
      this.radicals
    )) as WKRadicalItem[];
    return radicals.map((radical) => {
      return radical.getKanjiRadicalData();
    });
  }

  async mapVocabulary(): Promise<WKKanjiVocabulary[]> {
    const vocabulary = (await StorageHandler.getInstance().getItemsFromIds(
      this.vocabulary
    )) as WKVocabularyItem[];
    return vocabulary.map((vocabulary) => {
      return vocabulary.getKanjiVocabularyData();
    });
  }

  static hydrate(kanji: WKKanjiItem): void {
    Object.setPrototypeOf(kanji, WKKanjiItem.prototype);
    WKSrsData.hydrate(kanji.srs);
  }

  getValue(id: string): FieldValue {
    switch (id) {
      case "onyomi":
        return this.onyomi;
      case "kunyomi":
        return this.kunyomi;
      case "nanori":
        return this.nanori;
      case "emphasis":
        return this.emphasis;
      case "radicals":
        return this.radicals;
      case "vocabulary":
        return this.vocabulary;
      case "auxiliaryReadings":
        return this.auxiliaryReadings;
      case "readingHint":
        return this.readingHint;
      case "readingMnemonic":
        return this.readingMnemonic;
      case "meaningHint":
        return this.meaningHint;
      default:
        return super.getValue(id);
    }
  }

  setValue(id: string, value: FieldValue) {
    switch (id) {
      case "onyomi":
        this.onyomi = value as string[];
        break;
      case "kunyomi":
        this.kunyomi = value as string[];
        break;
      case "nanori":
        this.nanori = value as string[];
        break;
      case "emphasis":
        this.emphasis = value as "onyomi" | "kunyomi" | "nanori";
        break;
      case "radicals":
        this.radicals = value as number[];
        break;
      case "vocabulary":
        this.vocabulary = value as number[];
        break;
      case "auxiliaryReadings":
        this.auxiliaryReadings = value as AuxiliaryReading[];
        break;
      case "readingHint":
        this.readingHint = value as string;
        break;
      case "readingMnemonic":
        this.readingMnemonic = value as string;
        break;
      case "meaningHint":
        this.meaningHint = value as string;
        break;
      default:
        super.setValue(id, value);
    }
  }
}

interface WKKanjiReviewItem extends WKReviewItem {
  en: [string, ...string[]];
  id: number;
  on: string[];
  kan: string;
  kun: string[];
  emph: "onyomi" | "kunyomi" | "nanori";
  type: "Kanji";
  nanori: string[];
  category: "Kanji";
  characters: string;
  auxiliary_meanings: AuxiliaryMeaning[];
  auxiliary_readings: AuxiliaryReading[];
  srs: number;
  syn: string[];
}

interface WKKanjiLessonItem extends WKLessonItem {
  en: string[];
  id: number;
  on: string[];
  kan: string;
  kun: string[];
  emph: string;
  mhnt: string;
  mmne: string;
  rhnt: string;
  rmne: string;
  type: "Kanji";
  nanori: string[];
  category: "Kanji";
  radicals: WKKanjiRadical[];
  characters: string;
  vocabulary: WKKanjiVocabulary[];
  auxiliary_meanings: AuxiliaryMeaning[];
  auxiliary_readings: AuxiliaryReading[];
  relationships: WKRelationship;
}

interface WKKanjiJsonItem extends WKJsonItem {
  type: "Kanji";
  kan: string;
  meaning_mnemonic: string;
  meaning_hint: string;
  reading_mnemonic: string;
  reading_hint: string;
  reading_note: string | null;
  related: WKKanjiRadical[];
}

export interface WKKanjiRadical {
  id: number;
  en: string;
  rad: string;
  slug: string;
  type: "Radical";
  characters: string;
  character_image_url: string | null;
}

export interface WKKanjiVocabulary {
  en: string;
  ja: string;
  voc: string;
  slug: string;
  type: "Vocabulary";
  characters: string;
}
