import { StorageHandler } from "../../storageHandler";
import { WKVocabularyItem } from "../../wanikani";
import { Fields } from "./options";

const vocabularyFields: Fields = {
  characters: {
    type: "text",
    name: "Vocabulary",
    id: "characters",
    minLength: 1,
  },
  english: {
    type: "list",
    name: "English",
    id: "english",
    minOptions: 1,
    reorderable: true,
    innerFieldConstraints: {
      minLength: 1,
    },
  },
  kana: {
    type: "list",
    name: "Reading",
    id: "kana",
    minOptions: 1,
    reorderable: true,
    innerFieldConstraints: {
      minLength: 1,
    },
  },
  kanji: {
    type: "list",
    name: "Kanji",
    id: "kanji",
    innerFieldConstraints: {
      minLength: 1,
      maxLength: 1,
    },
  },
  meaningMnemonic: {
    type: "multi-line",
    name: "Meaning Mnemonic",
    id: "meaningMnemonic",
  },
  readingMnemonic: {
    type: "multi-line",
    name: "Reading Mnemonic",
    id: "readingMnemonic",
  },
  partsOfSpeech: {
    type: "list",
    name: "Parts of Speech",
    id: "partsOfSpeech",
    innerFieldConstraints: {
      minLength: 1,
    },
  },
};

export async function convertToVocabulary(
  values: Record<string, string | string[]>
): Promise<WKVocabularyItem> {
  // TODO: aux meanings, readings, sentences, collocations, synonyms and relationships
  return new WKVocabularyItem(
    await StorageHandler.getInstance().getNewId(),
    values["english"] as [string, ...string[]],
    values["characters"] as string,
    [],
    values["kana"] as string[],
    values["meaningMnemonic"] as string,
    values["readingMnemonic"] as string,
    await StorageHandler.getInstance().kanjiToIds(values["kanji"] as string[]),
    [],
    [],
    values["partsOfSpeech"] as string[],
    [],
    [],
    { study_material: null },
    []
  );
}

export { vocabularyFields };
