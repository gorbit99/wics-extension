import { AuxiliaryMeaning, WKRelationship } from "../common";

export interface WKReviewItem {
  id: number;
  en: string[];
  type: "Vocabulary" | "Kanji" | "Radical";
  category: "Vocabulary" | "Kanji" | "Radical";
  characters: string;
  srs: number;
}

export interface WKLessonItem {
  en: string[];
  id: number;
  mmne: string;
  type: "Vocabulary" | "Kanji" | "Radical";
  category: "Vocabulary" | "Kanji" | "Radical";
  characters: string;
  relationships: WKRelationship;
  auxiliary_meanings: AuxiliaryMeaning[];
}

export interface WKJsonItem {
  type: "Radical" | "Kanji" | "Vocabulary";
  id: number;
  characters: string;
  en: string;
  stroke: number | string;
  meaning_note: string | null;
}

export interface WKExportItem {
  deckId: number;
  level: number;
  type: "rad" | "kan" | "voc";
  english: [string, ...string[]];
  characters: string;
  auxiliaryMeanings: AuxiliaryMeaning[];
  meaningMnemonic: string;
}
