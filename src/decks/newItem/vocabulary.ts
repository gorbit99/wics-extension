import { StorageHandler } from "../../storageHandler";
import {
  AuxiliaryMeaning,
  AuxiliaryReading,
  WKVocabularyItem,
} from "../../wanikani";
import { EditableMultilineFieldRenderer } from "../itemForm/editableMultiline";
import { EditableValueFieldRenderer } from "../itemForm/editableValue";
import { FieldGroupRenderer } from "../itemForm/fields";
import { GroupedListFieldRenderer } from "../itemForm/groupedListField";
import { ListFieldRenderer } from "../itemForm/listField";
import { MultiLineFieldRenderer } from "../itemForm/multilineField";
import { SelectFieldRenderer } from "../itemForm/selectField";
import { TextFieldRenderer } from "../itemForm/textField";

type Vocabulary = {
  characters: string;
  english: string[];
  kana: string[];
  kanji: string[];
  meaningMnemonic: string;
  readingMnemonic: string;
  partsOfSpeech: string[];
  sentences: { english: string; japanese: string }[];
  auxiliaryMeanings: AuxiliaryMeaning[];
  auxiliaryReadings: AuxiliaryReading[];
};

const vocabularyInputFields: FieldGroupRenderer<Vocabulary> =
  new FieldGroupRenderer({
    characters: new TextFieldRenderer("Characters", 1, 1, "japanese"),
    english: new ListFieldRenderer(
      "English",
      { minLength: 1, type: "latin" },
      1,
      undefined,
      true
    ),
    kana: new ListFieldRenderer("Kana", { minLength: 1, type: "kana" }, 1),
    kanji: new ListFieldRenderer("Kanji", { minLength: 1, maxLength: 1 }),
    meaningMnemonic: new MultiLineFieldRenderer("Meaning Mnemonic"),
    readingMnemonic: new MultiLineFieldRenderer("Reading Mnemonic"),
    partsOfSpeech: new ListFieldRenderer("Parts of Speech", { minLength: 1 }),
    sentences: new GroupedListFieldRenderer(
      "Sentences",
      new FieldGroupRenderer<{ english: string; japanese: string }>({
        english: new TextFieldRenderer("English", 1),
        japanese: new TextFieldRenderer("Japanese", 1),
      }),
      true
    ),
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
  });

const vocabularyViewFields: FieldGroupRenderer<Vocabulary> =
  new FieldGroupRenderer({
    characters: new EditableValueFieldRenderer("Characters", 1, 1, "japanese"),
    english: new ListFieldRenderer(
      "English",
      { minLength: 1, type: "latin" },
      1,
      undefined,
      true
    ),
    kana: new ListFieldRenderer("Kana", { minLength: 1, type: "kana" }, 1),
    kanji: new ListFieldRenderer("Kanji", { minLength: 1, maxLength: 1 }),
    meaningMnemonic: new EditableMultilineFieldRenderer("Meaning Mnemonic"),
    readingMnemonic: new EditableMultilineFieldRenderer("Reaning Mnemonic"),
    partsOfSpeech: new ListFieldRenderer("Parts of Speech", { minLength: 1 }),
    sentences: new GroupedListFieldRenderer(
      "Sentences",
      new FieldGroupRenderer<{ english: string; japanese: string }>({
        english: new EditableValueFieldRenderer("English", 1),
        japanese: new EditableValueFieldRenderer("Japanese", 1),
      }),
      true
    ),
    auxiliaryMeanings: new GroupedListFieldRenderer(
      "Auxiliary Meanings",
      new FieldGroupRenderer<AuxiliaryMeaning>({
        meaning: new EditableValueFieldRenderer(
          "Meaning",
          1,
          undefined,
          "latin"
        ),
        type: new SelectFieldRenderer("Type", {
          whitelist: "Allow",
          blacklist: "Deny",
        }),
      })
    ),
    auxiliaryReadings: new GroupedListFieldRenderer(
      "Auxiliary Readings",
      new FieldGroupRenderer<AuxiliaryReading>({
        reading: new EditableValueFieldRenderer(
          "Reading",
          1,
          undefined,
          "kana"
        ),
        type: new SelectFieldRenderer("Type", {
          whitelist: "Allow",
          blacklist: "Deny",
        }),
      })
    ),
  });

export async function convertToVocabulary(
  values: Record<string, unknown>
): Promise<WKVocabularyItem> {
  const vocab = values as Vocabulary;
  // TODO: collocations, synonyms and relationships
  return new WKVocabularyItem(
    await StorageHandler.getInstance().getNewId(),
    vocab.english as [string, ...string[]],
    vocab.characters,
    [],
    vocab.kana,
    vocab.meaningMnemonic,
    vocab.readingMnemonic,
    await StorageHandler.getInstance().kanjiToIds(vocab.kanji),
    vocab.sentences,
    [],
    vocab["partsOfSpeech"],
    vocab.auxiliaryMeanings,
    vocab.auxiliaryReadings,
    { study_material: null },
    []
  );
}

export { vocabularyInputFields, vocabularyViewFields };
