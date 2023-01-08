import { StorageHandler } from "../../storageHandler";
import { WKRadicalItem } from "../../wanikani";
import { Fields } from "./options";

const radicalFields: Fields = {
  characters: {
    type: "text",
    name: "Radical",
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
    id: "meaningMnemonic",
    name: "Meaning Mnemonic",
  },
};

export async function convertToRadical(
  values: Record<string, string | string[]>
): Promise<WKRadicalItem> {
  return new WKRadicalItem(
    await StorageHandler.getInstance().getNewId(),
    values["english"] as [string, ...string[]],
    values["characters"] as string,
    // TODO: aux meanings, synonyms and relationships
    [],
    [],
    { study_material: null },
    values["meaningMnemonic"] as string,
    "",
    await StorageHandler.getInstance().kanjiToIds(values["kanji"] as string[])
  );
}

export { radicalFields };
