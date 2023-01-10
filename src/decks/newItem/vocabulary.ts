import { StorageHandler } from "../../storageHandler";
import { WKVocabularyItem } from "../../wanikani";
import { EditableMultilineFieldRenderer } from "../itemForm/editableMultiline";
import { EditableValueFieldRenderer } from "../itemForm/editableValue";
import { FieldGroupRenderer } from "../itemForm/fields";
import { GroupedListFieldRenderer } from "../itemForm/groupedListField";
import { ListFieldRenderer } from "../itemForm/listField";
import { MultiLineFieldRenderer } from "../itemForm/multilineField";
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
};

const vocabularyInputFields: FieldGroupRenderer<Vocabulary> =
  new FieldGroupRenderer({
    characters: new TextFieldRenderer("Characters", 1, 1),
    english: new ListFieldRenderer(
      "English",
      { minLength: 1 },
      1,
      undefined,
      true
    ),
    kana: new ListFieldRenderer("Kana", { minLength: 1 }, 1),
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
  });

const vocabularyViewFields: FieldGroupRenderer<Vocabulary> =
  new FieldGroupRenderer({
    characters: new EditableValueFieldRenderer("Characters", 1, 1),
    english: new ListFieldRenderer(
      "English",
      { minLength: 1 },
      1,
      undefined,
      true
    ),
    kana: new ListFieldRenderer("Kana", { minLength: 1 }, 1),
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
  });

export async function convertToVocabulary(
  values: Record<string, unknown>
): Promise<WKVocabularyItem> {
  const vocab = values as Vocabulary;
  // TODO: aux meanings, readings, sentences, collocations, synonyms and relationships
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
    [],
    [],
    { study_material: null },
    []
  );
}

export { vocabularyInputFields, vocabularyViewFields };
