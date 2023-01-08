import { StorageHandler } from "../../storageHandler";
import { WKKanjiItem } from "../../wanikani";
import { Fields } from "./options";

const kanjiFields: Fields = {
  characters: {
    type: "text",
    name: "Kanji",
    id: "characters",
    minLength: 1,
    maxLength: 1,
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
  emphasis: {
    type: "select",
    name: "Emphasis",
    id: "emphasis",
    options: [
      { text: "Onyomi", value: "onyomi" },
      { text: "Kunyomi", value: "kunyomi" },
      { text: "Nanori", value: "nanori" },
    ],
  },
  onyomi: {
    type: "list",
    name: "Onyomi",
    id: "onyomi",
    innerFieldConstraints: {
      minLength: 1,
    },
  },
  kunyomi: {
    type: "list",
    name: "Kunyomi",
    id: "kunyomi",
    innerFieldConstraints: {
      minLength: 1,
    },
  },
  vocabulary: {
    type: "list",
    name: "Vocabulary",
    id: "vocabulary",
    innerFieldConstraints: {
      minLength: 1,
    },
  },
  meaningMnemonic: {
    type: "multi-line",
    name: "Meaning Mnemonic",
    id: "meaningMnemonic",
  },
  meaningHint: {
    type: "multi-line",
    name: "Meaning Hint",
    id: "meaningHint",
  },
  readingMnemonic: {
    type: "multi-line",
    name: "Reading Mnemonic",
    id: "readingMnemonic",
  },
  readingHint: {
    type: "multi-line",
    name: "Reading Hint",
    id: "readingHint",
  },
};

export async function convertToKanji(
  values: Record<string, string | string[]>
): Promise<WKKanjiItem> {
  return new WKKanjiItem(
    await StorageHandler.getInstance().getNewId(),
    values["english"] as [string, ...string[]],
    values["characters"] as string,
    values["onyomi"] as string[],
    values["kunyomi"] as string[],
    values["vocabulary"] as string[],
    values["emphasis"] as "onyomi" | "kunyomi" | "nanori",
    values["meaningMnemonic"] as string,
    values["meaningHint"] as string,
    values["readingMnemonic"] as string,
    values["readingHint"] as string,
    // TODO: aux meanings, readings, synonyms and relationships
    [],
    await StorageHandler.getInstance().radicalsToIds(
      values["radicals"] as string[]
    ),
    await StorageHandler.getInstance().vocabularyToIds(
      values["vocabulary"] as string[]
    ),
    [],
    [],
    { study_material: null }
  );
}

export { kanjiFields };
