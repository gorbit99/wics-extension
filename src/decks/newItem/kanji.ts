import { StorageHandler } from "../../storageHandler";
import {
  AuxiliaryMeaning,
  AuxiliaryReading,
  WKKanjiItem,
  WKRelationship,
  WKStudyMaterial,
} from "../../wanikani";
import { ComplexFieldRenderer } from "../itemForm/complexField";
import { ConstantFieldRenderer } from "../itemForm/constantField";
import { EditableMultilineFieldRenderer } from "../itemForm/editableMultiline";
import { EditableValueFieldRenderer } from "../itemForm/editableValue";
import { FieldGroupRenderer } from "../itemForm/fields";
import { GroupedListFieldRenderer } from "../itemForm/groupedListField";
import { ListFieldRenderer } from "../itemForm/listField";
import { MultiLineFieldRenderer } from "../itemForm/multilineField";
import { SelectFieldRenderer } from "../itemForm/selectField";
import { TextFieldRenderer } from "../itemForm/textField";

export type Kanji = {
  characters: string;
  english: string[];
  emphasis: "onyomi" | "kunyomi" | "nanori";
  onyomi: string[];
  kunyomi: string[];
  nanori: string[];
  radicals: string[];
  vocabulary: string[];
  meaningMnemonic: string;
  meaningHint: string;
  readingMnemonic: string;
  readingHint: string;
  auxiliaryMeanings: AuxiliaryMeaning[];
  auxiliaryReadings: AuxiliaryReading[];
  relationships: WKRelationship;
};

const kanjiInputFields: FieldGroupRenderer<Kanji> = new FieldGroupRenderer({
  characters: new TextFieldRenderer("Kanji", 1, 1, "japanese"),
  english: new ListFieldRenderer(
    "English",
    { minLength: 1, type: "latin" },
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
    { minLength: 1, type: "kana" },
    undefined,
    undefined,
    true
  ),
  kunyomi: new ListFieldRenderer(
    "Kunyomi",
    { minLength: 1, type: "kana" },
    undefined,
    undefined,
    true
  ),
  nanori: new ListFieldRenderer(
    "Nanori",
    { minLength: 1, type: "kana" },
    undefined,
    undefined,
    true
  ),
  radicals: new ListFieldRenderer(
    "Radicals",
    { minLength: 1, type: "japanese" },
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
  auxiliaryMeanings: new GroupedListFieldRenderer(
    "Auxiliary Meanings",
    new FieldGroupRenderer<AuxiliaryMeaning>({
      meaning: new TextFieldRenderer("Meaning", 1, undefined, "latin"),
      type: new SelectFieldRenderer("Type", {
        whitelist: "Allow",
        blacklist: "Deny",
      }),
    })
  ),
  auxiliaryReadings: new GroupedListFieldRenderer(
    "Auxiliary Readings",
    new FieldGroupRenderer<AuxiliaryReading>({
      reading: new TextFieldRenderer("Reading", 1, undefined, "kana"),
      type: new SelectFieldRenderer("Type", {
        whitelist: "Allow",
        blacklist: "Deny",
      }),
    })
  ),
  relationships: new ConstantFieldRenderer<WKRelationship>({
    study_material: {
      id: 0,
      meaning_note: "",
      reading_note: "",
      meaning_synonyms: [],
    },
  }),
});

const kanjiViewFields: FieldGroupRenderer<Kanji> = new FieldGroupRenderer({
  characters: new EditableValueFieldRenderer("Kanji", 1, 1, "japanese"),
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
    { minLength: 1, type: "kana" },
    undefined,
    undefined,
    true
  ),
  kunyomi: new ListFieldRenderer(
    "Kunyomi",
    { minLength: 1, type: "kana" },
    undefined,
    undefined,
    true
  ),
  nanori: new ListFieldRenderer(
    "Nanori",
    { minLength: 1, type: "kana" },
    undefined,
    undefined,
    true
  ),
  radicals: new ListFieldRenderer(
    "Radicals",
    { minLength: 1, type: "japanese" },
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
  auxiliaryMeanings: new GroupedListFieldRenderer(
    "Auxiliary Meanings",
    new FieldGroupRenderer<AuxiliaryMeaning>({
      meaning: new EditableValueFieldRenderer("Meaning", 1, undefined, "latin"),
      type: new SelectFieldRenderer("Type", {
        whitelist: "Allow",
        blacklist: "Deny",
      }),
    })
  ),
  auxiliaryReadings: new GroupedListFieldRenderer(
    "Auxiliary Readings",
    new FieldGroupRenderer<AuxiliaryReading>({
      reading: new TextFieldRenderer("Reading", 1, undefined, "kana"),
      type: new SelectFieldRenderer("Type", {
        whitelist: "Allow",
        blacklist: "Deny",
      }),
    })
  ),
  relationships: new ComplexFieldRenderer<WKRelationship>(
    new FieldGroupRenderer<Required<WKRelationship>>({
      study_material: new ComplexFieldRenderer(
        new FieldGroupRenderer<WKStudyMaterial>({
          id: new ConstantFieldRenderer<number>(0),
          meaning_note: new EditableValueFieldRenderer("Meaning Note", 0),
          reading_note: new EditableValueFieldRenderer("Reading Note", 0),
          meaning_synonyms: new ListFieldRenderer(
            "Meaning Synonyms",
            { minLength: 1, type: "latin" },
            0
          ),
        })
      ),
    })
  ),
});

export async function convertToKanji(
  values: Record<string, any>
): Promise<WKKanjiItem> {
  const kanji = values as Kanji;
  return new WKKanjiItem(
    await StorageHandler.getInstance().getNewId(),
    kanji.english as [string, ...string[]],
    kanji.characters,
    kanji.onyomi,
    kanji.kunyomi,
    kanji.nanori,
    kanji.emphasis,
    kanji.meaningMnemonic,
    kanji.meaningHint,
    kanji.readingMnemonic,
    kanji.readingHint,
    await StorageHandler.getInstance().radicalsToIds(kanji.radicals),
    await StorageHandler.getInstance().vocabularyToIds(kanji.vocabulary),
    kanji.auxiliaryMeanings,
    kanji.auxiliaryReadings,
    kanji.relationships
  );
}

export { kanjiInputFields, kanjiViewFields };
