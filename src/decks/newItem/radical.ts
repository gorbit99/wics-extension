import { StorageHandler } from "../../storageHandler";
import { AuxiliaryMeaning, WKRadicalItem } from "../../wanikani";
import { EditableMultilineFieldRenderer } from "../itemForm/editableMultiline";
import { EditableValueFieldRenderer } from "../itemForm/editableValue";
import { FieldGroupRenderer } from "../itemForm/fields";
import { GroupedListFieldRenderer } from "../itemForm/groupedListField";
import { ListFieldRenderer } from "../itemForm/listField";
import { MultiLineFieldRenderer } from "../itemForm/multilineField";
import { SelectFieldRenderer } from "../itemForm/selectField";
import { TextFieldRenderer } from "../itemForm/textField";

type Radical = {
  characters: string;
  english: string[];
  kanji: string[];
  meaningMnemonic: string;
  auxiliaryMeanings: AuxiliaryMeaning[];
};

const radicalInputFields: FieldGroupRenderer<Radical> = new FieldGroupRenderer({
  characters: new TextFieldRenderer("Radical", 1, 1),
  english: new ListFieldRenderer(
    "English",
    { minLength: 1, type: "latin" },
    1,
    undefined,
    true
  ),
  kanji: new ListFieldRenderer("Kanji", { minLength: 1, maxLength: 1 }),
  meaningMnemonic: new MultiLineFieldRenderer("Meaning Mnemonic"),
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
});

const radicalViewFields: FieldGroupRenderer<Radical> = new FieldGroupRenderer({
  characters: new EditableValueFieldRenderer("Radical", 1, 1),
  english: new ListFieldRenderer(
    "English",
    { minLength: 1, type: "latin" },
    1,
    undefined,
    true
  ),
  kanji: new ListFieldRenderer("Kanji", { minLength: 1, maxLength: 1 }),
  meaningMnemonic: new EditableMultilineFieldRenderer("Meaning Mnemonic"),
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
});

export async function convertToRadical(
  values: Record<string, any>
): Promise<WKRadicalItem> {
  const radical = values as Radical;

  return new WKRadicalItem(
    await StorageHandler.getInstance().getNewId(),
    radical.english as [string, ...string[]],
    radical.characters,
    // TODO: synonyms and relationships
    radical.auxiliaryMeanings,
    [],
    { study_material: null },
    radical.meaningMnemonic,
    "",
    await StorageHandler.getInstance().kanjiToIds(radical.kanji)
  );
}

export { radicalInputFields, radicalViewFields };
