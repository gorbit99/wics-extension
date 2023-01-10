import { StorageHandler } from "../../storageHandler";
import { FieldValue, WKRadicalItem } from "../../wanikani";
import { EditableMultilineFieldRenderer } from "../itemForm/editableMultiline";
import { EditableValueFieldRenderer } from "../itemForm/editableValue";
import { FieldGroupRenderer } from "../itemForm/fields";
import { ListFieldRenderer } from "../itemForm/listField";
import { MultiLineFieldRenderer } from "../itemForm/multilineField";
import { TextFieldRenderer } from "../itemForm/textField";

type Radical = {
  characters: string;
  english: string[];
  kanji: string[];
  meaningMnemonic: string;
};

const radicalInputFields: FieldGroupRenderer<Radical> = new FieldGroupRenderer({
  characters: new TextFieldRenderer("Radical", 1, 1),
  english: new ListFieldRenderer(
    "English",
    { minLength: 1 },
    1,
    undefined,
    true
  ),
  kanji: new ListFieldRenderer("Kanji", { minLength: 1, maxLength: 1 }),
  meaningMnemonic: new MultiLineFieldRenderer("Meaning Mnemonic"),
});

const radicalViewFields: FieldGroupRenderer<Radical> = new FieldGroupRenderer({
  characters: new EditableValueFieldRenderer("Radical", 1, 1),
  english: new ListFieldRenderer(
    "English",
    { minLength: 1 },
    1,
    undefined,
    true
  ),
  kanji: new ListFieldRenderer("Kanji", { minLength: 1, maxLength: 1 }),
  meaningMnemonic: new EditableMultilineFieldRenderer("Meaning Mnemonic"),
});

export async function convertToRadical(
  values: Record<string, FieldValue>
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

export { radicalInputFields, radicalViewFields };
