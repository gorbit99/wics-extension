import { CustomDeck } from "../../storage/customDeck";
import { CsvFieldSelectorFieldRenderer } from "../itemForm/csvFieldSelectorField";
import { FieldGroupRenderer } from "../itemForm/fields";
import { FileFieldRenderer } from "../itemForm/fileField";
import { SelectFieldRenderer } from "../itemForm/selectField";
import { TextFieldRenderer } from "../itemForm/textField";
import Papa from "papaparse";
import { fetchUser } from "../../storage/wkapi/user";
import {
  AuxiliaryMeaning,
  AuxiliaryReading,
  WKItem,
  WKKanjiItem,
  WKRadicalItem,
  WKVocabularyItem,
} from "../../wanikani";
import { StorageHandler } from "../../storageHandler";
import { fromSubject } from "../../wanikani/fromSubject";
import { SubjectHandler } from "../../storage/wkapi/subject";

interface AnkiParameters {
  deckName: string;
  file: File;
  itemTypes: "radical" | "kanji" | "vocabulary" | "field";

  fieldValues: Record<keyof typeof wkItemFields, number>;
}

const wkItemFields = {
  type: "Type",
  english: "English",
  characters: "Characters",
  additionalMeanings: "Additional Meanings",
  blockedMeanings: "Blocked Meanings",
  additionalReadings: "Additional Readings",
  blockedReadings: "Blocked Readings",
  meaningMnemonic: "Meaning Mnemonic",
  characterImageUrl: "Character Image URL",
  kanji: "Kanji",
  onyomi: "Onyomi",
  kunyomi: "Kunyomi",
  nanori: "Nanori",
  emphasis: "Emphasis",
  meaningHint: "Meaning Hint",
  readingHint: "Reading Hint",
  readingMnemonic: "Reading Mnemonic",
  radicals: "Radicals",
  vocabulary: "Vocabulary",
  audio: "Audio",
  kana: "Kana",
  partsOfSpeech: "Parts of Speech",
};

export async function ankiFields() {
  return new FieldGroupRenderer<AnkiParameters, undefined>(
    {
      deckName: new TextFieldRenderer("Deck Name", {
        minLength: 1,
      }),
      file: new FileFieldRenderer("Anki file", { accept: ".txt" }),
      itemTypes: new SelectFieldRenderer("Item types", {
        radical: "Radicals",
        kanji: "Kanji",
        vocabulary: "Vocabulary",
        field: "Field",
      }),
      fieldValues: new CsvFieldSelectorFieldRenderer<keyof typeof wkItemFields>(
        "Field values",
        "file",
        "separator",
        wkItemFields,
        {
          requiredFields: ["characters", "english"],
        },
        true,
        "\t"
      ),
    },
    {}
  );
}

export async function importAnki(
  parameters: AnkiParameters
): Promise<CustomDeck> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const csvData = Papa.parse(reader.result as string, {
        delimiter: "\t",
        skipEmptyLines: true,
        comments: "#",
      }).data as string[][];

      const fieldNames = parameters.fieldValues;
      const fieldIndices = Object.fromEntries(
        Object.entries(fieldNames).map(([key, value]) => [key, value])
      ) as Record<keyof typeof wkItemFields, number>;

      const user = await fetchUser();
      const deck = new CustomDeck(parameters.deckName, user.username);

      let nextId = await StorageHandler.getInstance().getNewId();

      const wkItems = (await SubjectHandler.getInstance().fetchItems()).map(
        (subject) => fromSubject(subject)
      );

      const getIdFromCharacter = (
        character: string,
        type: "radical" | "kanji" | "vocabulary"
      ) =>
        wkItems
          .find(
            (item) => item.getCharacters() == character && item.type == type
          )
          ?.getID() ?? 0;

      await Promise.all(
        csvData.map(async (row, i) => {
          const type =
            parameters.itemTypes === "field"
              ? row[fieldIndices.type]!
              : parameters.itemTypes;
          const item = parseRow(
            type as "radical" | "kanji" | "vocabulary",
            row,
            fieldIndices,
            nextId,
            -i - 1,
            getIdFromCharacter
          );
          nextId++;

          deck.addItem(await item);
        })
      );
      resolve(deck);
    };
    reader.readAsText(parameters.file);
  });
}

async function parseRow(
  type: "radical" | "kanji" | "vocabulary",
  row: string[],
  fieldIndices: Record<keyof typeof wkItemFields, number>,
  id: number,
  deckId: number,
  getIdFromCharacter: (
    character: string,
    type: "radical" | "kanji" | "vocabulary"
  ) => number
): Promise<WKItem> {
  const english = row[fieldIndices.english]!.split(",") as [
    string,
    ...string[]
  ];

  const additionalMeanings =
    row[fieldIndices.additionalMeanings]?.split(",") ?? [];
  const blockedMeanings = row[fieldIndices.blockedMeanings]?.split(",") ?? [];
  const auxiliaryMeanings = additionalMeanings
    .map((meaning) => ({ meaning, type: "whitelist" }))
    .concat(
      blockedMeanings.map((meaning) => ({ meaning, type: "blacklist" }))
    ) as AuxiliaryMeaning[];

  switch (type) {
    case "radical": {
      return new WKRadicalItem(
        id,
        deckId,
        1,
        english,
        row[fieldIndices.characters]!,
        auxiliaryMeanings,
        {
          study_material: {
            meaning_note: "",
            meaning_synonyms: [],
            reading_note: "",
            id: 0,
          },
        },
        row[fieldIndices.meaningMnemonic] ?? "",
        row[fieldIndices.characterImageUrl] ?? null,
        (row[fieldIndices.kanji]?.split(",") ?? []).map((character) =>
          getIdFromCharacter(character, "kanji")
        )
      );
    }
    case "kanji": {
      const additionalReadings =
        row[fieldIndices.additionalReadings]?.split(",") ?? [];
      const blockedReadings =
        row[fieldIndices.blockedReadings]?.split(",") ?? [];
      const auxiliaryReadings = additionalReadings
        .map((reading) => ({ reading, type: "whitelist" }))
        .concat(
          blockedReadings.map((reading) => ({ reading, type: "blacklist" }))
        ) as AuxiliaryReading[];

      return new WKKanjiItem(
        id,
        deckId,
        1,
        english,
        row[fieldIndices.characters]!,
        row[fieldIndices.onyomi]?.split(",") ?? [],
        row[fieldIndices.kunyomi]?.split(",") ?? [],
        row[fieldIndices.nanori]?.split(",") ?? [],
        (row[fieldIndices.emphasis] as
          | "onyomi"
          | "kunyomi"
          | "nanori"
          | undefined) ?? "onyomi",
        row[fieldIndices.meaningMnemonic] ?? "",
        row[fieldIndices.meaningHint] ?? "",
        row[fieldIndices.readingMnemonic] ?? "",
        row[fieldIndices.readingHint] ?? "",
        (row[fieldIndices.radicals]?.split(",") ?? []).map((character) =>
          getIdFromCharacter(character, "radical")
        ),
        (row[fieldIndices.vocabulary]?.split(",") ?? []).map((character) =>
          getIdFromCharacter(character, "vocabulary")
        ),
        auxiliaryMeanings,
        auxiliaryReadings,
        {
          study_material: {
            meaning_note: "",
            meaning_synonyms: [],
            reading_note: "",
            id: 0,
          },
        }
      );
    }
    case "vocabulary": {
      const additionalReadings =
        row[fieldIndices.additionalReadings]?.split(",") ?? [];
      const blockedReadings =
        row[fieldIndices.blockedReadings]?.split(",") ?? [];
      const auxiliaryReadings = additionalReadings
        .map((reading) => ({ reading, type: "whitelist" }))
        .concat(
          blockedReadings.map((reading) => ({ reading, type: "blacklist" }))
        ) as AuxiliaryReading[];

      return new WKVocabularyItem(
        id,
        deckId,
        1,
        english,
        row[fieldIndices.characters]!,
        [],
        row[fieldIndices.kana]?.split(",") ?? [],
        row[fieldIndices.meaningMnemonic] ?? "",
        row[fieldIndices.readingMnemonic] ?? "",
        (row[fieldIndices.kanji]?.split(",") ?? []).map((character) =>
          getIdFromCharacter(character, "kanji")
        ),
        [],
        [],
        row[fieldIndices.partsOfSpeech]?.split(",") ?? [],
        auxiliaryMeanings,
        auxiliaryReadings,
        {
          study_material: {
            meaning_note: "",
            meaning_synonyms: [],
            reading_note: "",
            id: 0,
          },
        }
      );
    }
  }
}
