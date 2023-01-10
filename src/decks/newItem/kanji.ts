import { StorageHandler } from "../../storageHandler";
import { FieldValue, WKKanjiItem } from "../../wanikani";
import { EditableMultilineFieldRenderer } from "../itemForm/editableMultiline";
import { EditableValueFieldRenderer } from "../itemForm/editableValue";
import { FieldGroupRenderer } from "../itemForm/fields";
import { ListFieldRenderer } from "../itemForm/listField";
import { MultiLineFieldRenderer } from "../itemForm/multilineField";
import { SelectFieldRenderer } from "../itemForm/selectField";
import { TextFieldRenderer } from "../itemForm/textField";

type Kanji = {
  characters: string;
  english: string[];
  emphasis: "onyomi" | "kunyomi" | "nanori";
  onyomi: string[];
  kunyomi: string[];
  nanori: string[];
  vocabulary: string[];
  meaningMnemonic: string;
  meaningHint: string;
  readingMnemonic: string;
  readingHint: string;
};

const kanjiInputFields: FieldGroupRenderer<Kanji> = new FieldGroupRenderer({
  characters: new TextFieldRenderer("Kanji", 1, 1),
  english: new ListFieldRenderer(
    "English",
    { minLength: 1 },
    1,
    undefined,
    true
  ),
  emphasis: new SelectFieldRenderer("Emphasis", {
    onyomi: "Onyomi",
    kunyomi: "Kunyomi",
    nanori: "Nanori",
  }),
  onyomi: new ListFieldRenderer(
    "Onyomi",
    { minLength: 1 },
    undefined,
    undefined,
    true
  ),
  kunyomi: new ListFieldRenderer(
    "Kunyomi",
    { minLength: 1 },
    undefined,
    undefined,
    true
  ),
  nanori: new ListFieldRenderer(
    "Nanori",
    { minLength: 1 },
    undefined,
    undefined,
    true
  ),
  vocabulary: new ListFieldRenderer(
    "Vocabulary",
    { minLength: 1 },
    undefined,
    undefined
  ),
  meaningMnemonic: new MultiLineFieldRenderer("Meaning Mnemonic"),
  meaningHint: new MultiLineFieldRenderer("Meaning Hint"),
  readingMnemonic: new MultiLineFieldRenderer("Reading Mnemonic"),
  readingHint: new MultiLineFieldRenderer("Reading Hint"),
});

const kanjiViewFields: FieldGroupRenderer<Kanji> = new FieldGroupRenderer({
  characters: new EditableValueFieldRenderer("Kanji", 1, 1),
  english: new ListFieldRenderer(
    "English",
    { minLength: 1 },
    1,
    undefined,
    true
  ),
  emphasis: new SelectFieldRenderer("Emphasis", {
    onyomi: "Onyomi",
    kunyomi: "Kunyomi",
    nanori: "Nanori",
  }),
  onyomi: new ListFieldRenderer(
    "Onyomi",
    { minLength: 1 },
    undefined,
    undefined,
    true
  ),
  kunyomi: new ListFieldRenderer(
    "Kunyomi",
    { minLength: 1 },
    undefined,
    undefined,
    true
  ),
  nanori: new ListFieldRenderer(
    "Nanori",
    { minLength: 1 },
    undefined,
    undefined,
    true
  ),
  vocabulary: new ListFieldRenderer(
    "Vocabulary",
    { minLength: 1 },
    undefined,
    undefined
  ),
  meaningMnemonic: new EditableMultilineFieldRenderer("Meaning Mnemonic"),
  meaningHint: new EditableMultilineFieldRenderer("Meaning Hint"),
  readingMnemonic: new EditableMultilineFieldRenderer("Reading Mnemonic"),
  readingHint: new EditableMultilineFieldRenderer("Reading Hint"),
});

export async function convertToKanji(
  values: Record<string, FieldValue>
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

export { kanjiInputFields, kanjiViewFields };
