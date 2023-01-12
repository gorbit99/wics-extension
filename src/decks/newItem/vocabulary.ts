import { StorageHandler } from "../../storageHandler";
import {
  AuxiliaryMeaning,
  AuxiliaryReading,
  Collocation,
  WKRelationship,
  WKStudyMaterial,
  WKVocabularyItem,
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

interface Audio {
  url: string;
  contentType: "audio/mpeg" | "audio/ogg";
  pronunciation: string;
}

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
  relationships: WKRelationship;
  collocations: Collocation[];
  audio: Audio[];
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
    collocations: new GroupedListFieldRenderer(
      "Collocations",
      new FieldGroupRenderer<Collocation>({
        english: new TextFieldRenderer("English", 1, undefined, "latin"),
        japanese: new TextFieldRenderer("Japanese", 1, undefined, "japanese"),
        pattern_of_use: new TextFieldRenderer("Pattern of Use", 1),
      }),
      true
    ),
    audio: new GroupedListFieldRenderer(
      "Audio",
      new FieldGroupRenderer<Audio>({
        url: new TextFieldRenderer("URL", 1),
        contentType: new SelectFieldRenderer("Content Type", {
          "audio/mpeg": "MPEG",
          "audio/ogg": "OGG",
        }),
        pronunciation: new TextFieldRenderer(
          "Pronunciation",
          1,
          undefined,
          "kana"
        ),
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
    collocations: new GroupedListFieldRenderer(
      "Collocations",
      new FieldGroupRenderer<Collocation>({
        english: new EditableValueFieldRenderer(
          "English",
          1,
          undefined,
          "latin"
        ),
        japanese: new EditableValueFieldRenderer(
          "Japanese",
          1,
          undefined,
          "japanese"
        ),
        pattern_of_use: new EditableValueFieldRenderer("Pattern of Use", 1),
      }),
      true
    ),
    audio: new GroupedListFieldRenderer(
      "Audio",
      new FieldGroupRenderer<Audio>({
        url: new EditableValueFieldRenderer("URL", 1),
        contentType: new SelectFieldRenderer("Content Type", {
          "audio/mpeg": "MPEG",
          "audio/ogg": "OGG",
        }),
        pronunciation: new EditableValueFieldRenderer(
          "Pronunciation",
          1,
          undefined,
          "kana"
        ),
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

export async function convertToVocabulary(
  values: Record<string, unknown>
): Promise<WKVocabularyItem> {
  const vocab = values as Vocabulary;
  return new WKVocabularyItem(
    await StorageHandler.getInstance().getNewId(),
    vocab.english as [string, ...string[]],
    vocab.characters,
    vocab.audio.map((audio) => ({
      url: audio.url,
      content_type: audio.contentType,
      voice_actor_id: 1,
      pronunciation: audio.pronunciation,
    })),
    vocab.kana,
    vocab.meaningMnemonic,
    vocab.readingMnemonic,
    await StorageHandler.getInstance().kanjiToIds(vocab.kanji),
    vocab.sentences,
    vocab.collocations,
    vocab.partsOfSpeech,
    vocab.auxiliaryMeanings,
    vocab.auxiliaryReadings,
    vocab.relationships
  );
}

export { vocabularyInputFields, vocabularyViewFields };
