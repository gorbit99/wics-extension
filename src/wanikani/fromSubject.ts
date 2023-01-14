import {
  WKKanjiSubject,
  WKRadicalSubject,
  WKSubject,
  WKVocabularySubject,
} from "../storage/wkapi";
import { WKItem } from "./item";
import { WKKanjiItem } from "./kanji";
import { WKRadicalItem } from "./radical";
import { WKVocabularyItem } from "./vocabulary";

export function fromSubject(subject: WKSubject): WKItem {
  switch (subject.object) {
    case "radical":
      return WKRadicalItem.fromSubject(subject as WKRadicalSubject);
    case "kanji":
      return WKKanjiItem.fromSubject(subject as WKKanjiSubject);
    case "vocabulary":
      return WKVocabularyItem.fromSubject(subject as WKVocabularySubject);
  }
}
