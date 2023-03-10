import { CustomDeck } from "../storage/customDeck";
import { WKVocabularySubject } from "../storage/wkapi/subject";
import { StorageHandler } from "../storageHandler";
import { AuxiliaryMeaning, AuxiliaryReading, WKRelationship } from "./common";
import { WKItem } from "./item";
import {
  WKExportItem,
  WKJsonItem,
  WKLessonItem,
  WKReviewItem,
} from "./item/types";
import { WKKanjiItem, WKKanjiVocabulary } from "./kanji";
import { WKSrsData } from "./srsData";

export class WKVocabularyItem extends WKItem {
  constructor(
    id: number,
    deckId: number,
    level: number,
    english: [string, ...string[]],
    characters: string,
    private audio: Audio[],
    private kana: string[],
    meaningMnemonic: string,
    private readingMnemonic: string,
    private kanji: number[],
    private sentences: { english: string; japanese: string }[],
    private collocations: Collocation[],
    private partsOfSpeech: string[],
    auxiliaryMeanings: AuxiliaryMeaning[],
    private auxiliaryReadings: AuxiliaryReading[],
    relationships: WKRelationship
  ) {
    super(
      id,
      deckId,
      level,
      "vocabulary",
      english,
      characters,
      relationships,
      auxiliaryMeanings,
      meaningMnemonic
    );
  }

  async getReviewData(parent: CustomDeck): Promise<WKVocabularyReviewItem> {
    return {
      en: this.english,
      id: this.id,
      aud: this.audio,
      voc: this.characters,
      kana: this.kana,
      type: "Vocabulary",
      kanji: await this.mapKanji(parent),
      category: "Vocabulary",
      characters: this.characters,
      auxiliary_meanings: this.auxiliaryMeanings,
      auxiliary_readings: this.auxiliaryReadings,
      srs: this.srs.getStage(),
      syn: this.relationships.study_material?.meaning_synonyms ?? [],
    };
  }

  async getLessonData(parent: CustomDeck): Promise<WKVocabularyLessonItem> {
    return {
      en: this.english,
      id: this.id,
      aud: this.audio,
      voc: this.characters,
      kana: this.kana,
      mmne: this.meaningMnemonic,
      rmne: this.readingMnemonic,
      type: "Vocabulary",
      kanji: await this.mapKanji(parent),
      category: "Vocabulary",
      sentences: this.sentences.map((sentence) => [
        sentence.english,
        sentence.japanese,
      ]),
      characters: this.characters,
      collocations: this.collocations,
      parts_of_speech: this.partsOfSpeech,
      auxiliary_meanings: this.auxiliaryMeanings,
      auxiliary_readings: this.auxiliaryReadings,
      relationships: this.relationships,
    };
  }

  async getJsonData(): Promise<WKVocabularyJsonItem> {
    return {
      id: this.id,
      type: "Vocabulary",
      characters: this.characters,
      en: this.english.join(", "),
      stroke: "C",
      meaning_note: this.relationships.study_material?.meaning_note ?? null,
      meaning_explanation: this.meaningMnemonic,
      reading_explanation: this.readingMnemonic,
      voc: this.characters,
      kana: this.kana.join(", "),
      sentences: this.sentences.map((sentence) => [
        sentence.english,
        sentence.japanese,
      ]),
      reading_note: this.relationships.study_material?.reading_note ?? null,
      parts_of_speech: this.partsOfSpeech,
      audio: this.audio.map((audio) => ({
        url: audio.url,
        content_type: audio.content_type,
        metadata: {
          pronunciation: audio.pronunciation,
          voice_actor_id: audio.voice_actor_id,
          voice_actor_name: "Custom",
          gender: "male",
          voice_description: "Custom",
          source_id: 0,
        },
      })),
      related: (
        await StorageHandler.getInstance().getAllItemsFromIds(this.kanji)
      ).map((item) => (item as WKKanjiItem).getVocabKanjiData()),
    };
  }

  getExportData(): WKVocabularyExportItem {
    return {
      ...this.getBaseExportData(),
      audio: this.audio,
      kana: this.kana,
      readingMnemonic: this.readingMnemonic,
      kanji: this.kanji,
      sentences: this.sentences,
      collocations: this.collocations,
      partsOfSpeech: this.partsOfSpeech,
      auxiliaryReadings: this.auxiliaryReadings,
    } as WKVocabularyExportItem;
  }

  static fromExportData(
    id: number,
    data: WKVocabularyExportItem
  ): WKVocabularyItem {
    return new WKVocabularyItem(
      id,
      data.deckId,
      data.level ?? 1,
      data.english,
      data.characters,
      data.audio,
      data.kana,
      data.meaningMnemonic,
      data.readingMnemonic,
      data.kanji,
      data.sentences,
      data.collocations,
      data.partsOfSpeech,
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

  getKanjiVocabularyData(): WKKanjiVocabulary {
    return {
      en: this.english[0],
      ja: this.characters,
      voc: this.characters,
      slug: this.characters,
      type: "Vocabulary",
      characters: this.characters,
    };
  }

  async mapKanji(parent: CustomDeck): Promise<WKVocabularyKanji[]> {
    return (await parent.mapRelatedItems(this.kanji)).map((item) =>
      (item as WKKanjiItem).getVocabKanjiData()
    );
  }

  static hydrate(vocabulary: WKVocabularyItem): void {
    Object.setPrototypeOf(vocabulary, WKVocabularyItem.prototype);
    WKSrsData.hydrate(vocabulary.srs);
  }

  updateFromItem(item: WKVocabularyItem) {
    super.updateFromItem(item);
    this.audio = item.audio;
    this.kana = item.kana;
    this.readingMnemonic = item.readingMnemonic;
    this.kanji = item.kanji;
    this.sentences = item.sentences;
    this.collocations = item.collocations;
    this.partsOfSpeech = item.partsOfSpeech;
    this.auxiliaryReadings = item.auxiliaryReadings;
  }

  getValue(id: string): any {
    switch (id) {
      case "audio":
        return this.audio;
      case "kana":
        return this.kana;
      case "readingMnemonic":
        return this.readingMnemonic;
      case "kanji":
        return this.kanji;
      case "sentences":
        return this.sentences;
      case "collocations":
        return this.collocations;
      case "partsOfSpeech":
        return this.partsOfSpeech;
      case "auxiliaryReadings":
        return this.auxiliaryReadings;
      default:
        return super.getValue(id);
    }
  }

  setValue(id: string, value: any): void {
    switch (id) {
      case "audio":
        this.audio = value as Audio[];
        break;
      case "kana":
        this.kana = value as string[];
        break;
      case "readingMnemonic":
        this.readingMnemonic = value as string;
        break;
      case "kanji":
        this.kanji = value as number[];
        break;
      case "sentences":
        this.sentences = value as { japanese: string; english: string }[];
        break;
      case "collocations":
        this.collocations = value as Collocation[];
        break;
      case "partsOfSpeech":
        this.partsOfSpeech = value as string[];
        break;
      case "auxiliaryReadings":
        this.auxiliaryReadings = value as AuxiliaryReading[];
        break;
      default:
        super.setValue(id, value);
    }
  }

  static fromSubject(subject: WKVocabularySubject): WKVocabularyItem {
    return new WKVocabularyItem(
      subject.id,
      subject.id,
      subject.level,
      subject.meanings
        .sort((a, _) => (a.primary ? -1 : 1))
        .map((meaning) => meaning.meaning) as [string, ...string[]],
      subject.characters!,
      subject.pronunciation_audios.map((audio) => ({
        url: audio.url,
        content_type: audio.content_type,
        pronunciation: audio.metadata.pronunciation,
        voice_actor_id: audio.metadata.voice_actor_id,
      })),
      subject.readings
        .sort((a, _) => (a.primary ? -1 : 1))
        .map((reading) => reading.reading),
      subject.meaning_mnemonic,
      subject.reading_mnemonic,
      subject.component_subject_ids,
      subject.context_sentences.map((sentence) => ({
        english: sentence.en,
        japanese: sentence.ja,
      })),
      [],
      subject.parts_of_speech,
      subject.auxiliary_meanings,
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
    return this.kana;
  }

  clone(deckId: number, id: number): WKVocabularyItem {
    return new WKVocabularyItem(
      id,
      deckId,
      this.getSrs().getLevel(),
      this.english,
      this.characters,
      this.audio,
      this.kana,
      this.meaningMnemonic,
      this.readingMnemonic,
      this.kanji,
      this.sentences,
      this.collocations,
      this.partsOfSpeech,
      this.auxiliaryMeanings,
      this.auxiliaryReadings,
      this.relationships
    );
  }

  removeRelated(deckId: number) {
    this.kanji = this.kanji.filter((id) => id !== deckId);
  }

  addRelatedKanji(deckId: number) {
    this.kanji.push(deckId);
  }

  fixUpRelated(deck: CustomDeck) {
    this.kanji = this.kanji
      .map(
        (id) =>
          deck
            .getItems()
            .find((item) => item.getID() === id)
            ?.getDeckId() ?? undefined
      )
      .filter((id) => id !== undefined) as number[];
  }

  async isUnlocked(deck: CustomDeck): Promise<boolean> {
    return (
      (await super.isUnlocked(deck)) && this.areRelatedPassed(this.kanji, deck)
    );
  }
}

export interface Collocation {
  english: string;
  japanese: string;
  pattern_of_use: string;
}

export interface Audio {
  url: string;
  content_type: string;
  pronunciation: string;
  voice_actor_id: number;
}

export interface WKVocabularyReviewItem extends WKReviewItem {
  aud: Audio[];
  voc: string;
  kana: string[];
  type: "Vocabulary";
  kanji: WKVocabularyKanji[];
  category: "Vocabulary";
  auxiliary_meanings: AuxiliaryMeaning[];
  auxiliary_readings: AuxiliaryReading[];
  syn: string[];
}

export interface WKVocabularyLessonItem extends WKLessonItem {
  voc: string;
  kana: string[];
  aud: Audio[];
  rmne: string;
  type: "Vocabulary";
  kanji: WKVocabularyKanji[];
  category: "Vocabulary";
  sentences: [string, string][];
  collocations: Collocation[];
  parts_of_speech: string[];
  auxiliary_readings: AuxiliaryReading[];
}

export interface WKVocabularyJsonItem extends WKJsonItem {
  type: "Vocabulary";
  meaning_explanation: string;
  reading_explanation: string;
  voc: string;
  kana: string;
  sentences: [string, string][];
  reading_note: string | null;
  parts_of_speech: string[];
  audio: JsonAudio[];
  related: WKVocabularyKanji[];
}

export interface WKVocabularyExportItem extends WKExportItem {
  type: "voc";
  audio: Audio[];
  kana: string[];
  readingMnemonic: string;
  kanji: number[];
  sentences: { japanese: string; english: string }[];
  collocations: Collocation[];
  partsOfSpeech: string[];
  auxiliaryReadings: AuxiliaryReading[];
}

interface JsonAudio {
  url: string;
  metadata: {
    gender: "male" | "female";
    source_id: number;
    pronunciation: string;
    voice_actor_id: number;
    voice_actor_name: string;
    voice_description: string;
  };
  content_type: string;
}

export interface WKVocabularyKanji {
  en: string;
  id: number;
  ja: string;
  kan: string;
  type: "Kanji";
  characters: string;
}
