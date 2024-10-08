export type FieldType = "text" | "email" | "number" | "radio";

export type Field = {
  id?: number;
  label: string;
  fieldType: FieldType;
  required: boolean;
  description?: string;
  extra?: object;
  validate: () => boolean;
};

export type EmailField = Field & {
  fieldType: "email";
  extra: {
    confirmationAddress: boolean;
    useWpUserEmail: boolean;
  };
};

export type NumberField = Field & {
  fieldType: "number";
  extra: {
    useAsNumberOfPeople: boolean;
    min?: number;
    max?: number;
  };
};

export type RadioField = Field & {
  fieldType: "radio";
  extra: {
    options: string[];
  };
};
