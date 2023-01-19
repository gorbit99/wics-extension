import { WKItem, WKKanjiItem, WKRadicalItem, WKVocabularyItem } from ".";

export function hydrateWKItem(item: WKItem) {
  switch ((item as WKItem).type) {
    case "radical":
      WKRadicalItem.hydrate(item as WKRadicalItem);
      break;
    case "kanji":
      WKKanjiItem.hydrate(item as WKKanjiItem);
      break;
    case "vocabulary":
      WKVocabularyItem.hydrate(item as WKVocabularyItem);
      break;
  }
}
