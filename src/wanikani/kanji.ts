import { WKSrsData } from ".";
import { WKKanjiSubject } from "../storage/wkapi";
import { StorageHandler } from "../storageHandler";
import { AuxiliaryMeaning, AuxiliaryReading, WKRelationship } from "./common";
import { WKItem } from "./item";
import {
  WKExportItem,
  WKJsonItem,
  WKLessonItem,
  WKReviewItem,
} from "./item/types";
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
      syn: this.relationships.study_material?.meaning_synonyms ?? [],
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
      related: (
        await StorageHandler.getInstance().getAllItemsFromIds(this.radicals)
      ).map((item) => (item as WKRadicalItem).getKanjiRadicalData()),
    };
  }

  async getExportData(wkItems: WKItem[]): Promise<WKKanjiExportItem> {
    return {
      ...this.getBaseExportData(),
      onyomi: this.onyomi,
      kunyomi: this.kunyomi,
      nanori: this.nanori,
      emphasis: this.emphasis,
      meaningHint: this.meaningHint,
      readingHint: this.readingHint,
      readingMnemonic: this.readingMnemonic,
      radicals: wkItems
        .filter((item) => this.radicals.includes(item.getID()))
        .map((item) => item.getCharacters()),
      vocabulary: wkItems
        .filter((item) => this.vocabulary.includes(item.getID()))
        .map((item) => item.getCharacters()),
      auxiliaryReadings: this.auxiliaryReadings,
    } as WKKanjiExportItem;
  }

  static async fromExportData(
    id: number,
    data: WKKanjiExportItem,
    getIdFromCharacter: (
      character: string,
      type: "radical" | "kanji" | "vocabulary"
    ) => number
  ): Promise<WKKanjiItem> {
    return new WKKanjiItem(
      id,
      data.english,
      data.characters,
      data.onyomi,
      data.kunyomi,
      data.nanori,
      data.emphasis,
      data.meaningMnemonic,
      data.meaningHint,
      data.readingMnemonic,
      data.readingHint,
      data.radicals.map((character) =>
        getIdFromCharacter(character, "radical")
      ),
      data.vocabulary.map((character) =>
        getIdFromCharacter(character, "vocabulary")
      ),
      data.auxiliaryMeanings,
      data.auxiliaryReadings,
      {
        study_material: {
          meaning_synonyms: [],
          meaning_note: "",
          reading_note: "",
          id: 0,
        },
      }
    );
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
    const radicals = (await StorageHandler.getInstance().getAllItemsFromIds(
      this.radicals
    )) as WKRadicalItem[];
    return radicals.map((radical) => {
      return radical.getKanjiRadicalData();
    });
  }

  async mapVocabulary(): Promise<WKKanjiVocabulary[]> {
    const vocabulary = (await StorageHandler.getInstance().getAllItemsFromIds(
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

  getValue(id: string): any {
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

  setValue(id: string, value: any) {
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

  static fromSubject(subject: WKKanjiSubject): WKKanjiItem {
    return new WKKanjiItem(
      subject.id,
      subject.meanings
        .sort((a, _) => (a.primary ? -1 : 1))
        .map((meaning) => meaning.meaning) as [string, ...string[]],
      subject.characters!,
      subject.readings
        .sort((a, _) => (a.primary ? -1 : 1))
        .filter((reading) => reading.type === "onyomi")
        .map((reading) => reading.reading),
      subject.readings
        .sort((a, _) => (a.primary ? -1 : 1))
        .filter((reading) => reading.type === "kunyomi")
        .map((reading) => reading.reading),
      subject.readings
        .sort((a, _) => (a.primary ? -1 : 1))
        .filter((reading) => reading.type === "nanori")
        .map((reading) => reading.reading),
      subject.readings.find((reading) => reading.primary)!.type,
      subject.meaning_mnemonic,
      subject.meaning_hint!,
      subject.reading_mnemonic,
      subject.reading_hint!,
      subject.component_subject_ids,
      subject.amalgamation_subject_ids,
      subject.auxiliary_meanings,
      // TODO: auxiliary readings, relationships
      [],
      {
        study_material: {
          meaning_synonyms: [],
          meaning_note: "",
          reading_note: "",
          id: 0,
        },
      }
    );
  }

  getReadings(): string[] {
    return [...this.onyomi, ...this.kunyomi, ...this.nanori];
  }
}

export interface WKKanjiReviewItem extends WKReviewItem {
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

export interface WKKanjiLessonItem extends WKLessonItem {
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

export interface WKKanjiJsonItem extends WKJsonItem {
  type: "Kanji";
  kan: string;
  meaning_mnemonic: string;
  meaning_hint: string;
  reading_mnemonic: string;
  reading_hint: string;
  reading_note: string | null;
  related: WKKanjiRadical[];
}

export interface WKKanjiExportItem extends WKExportItem {
  type: "kan";
  onyomi: string[];
  kunyomi: string[];
  nanori: string[];
  emphasis: "onyomi" | "kunyomi" | "nanori";
  meaningHint: string;
  readingHint: string;
  readingMnemonic: string;
  radicals: string[];
  vocabulary: string[];
  auxiliaryReadings: AuxiliaryReading[];
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
