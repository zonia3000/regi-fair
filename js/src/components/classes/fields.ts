export type FieldType =
  | "text"
  | "email"
  | "number"
  | "radio"
  | "checkbox"
  | "privacy";

export type Field = {
  id?: number;
  label: string;
  fieldType: FieldType;
  required: boolean;
  description?: string;
  extra?: object;
  validate: () => boolean;
};

export type CheckboxField = Field & {
  fieldType: "checkbox";
};

export type PrivacyField = Field & {
  fieldType: "privacy";
  extra?: {
    url?: string;
  };
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
