import React from "react";
import {
  Field,
  PrivacyField as PrivacyFieldType,
  RadioField as RadioFieldType,
  DropdownField as DropdownFieldType,
} from "./classes/fields";
import { FormFieldsProps } from "./classes/components-props";
import InputField from "./fields/InputField";
import "./style.css";
import RadioField from "./fields/RadioField";
import CheckboxField from "./fields/CheckboxField";
import PrivacyField from "./fields/PrivacyField";
import DropdownField from "./fields/DropdownField";

const FormFields = (props: FormFieldsProps) => {
  function setFieldValue(key: number, newValue: string | string[] | boolean) {
    props.setFieldsValues(
      Object.fromEntries(
        Object.entries(props.fieldsValues).map((e) =>
          e[0] === key.toString() ? [e[0], newValue] : e,
        ),
      ),
    );
  }

  return props.formFields.map((field: Field) => {
    return (
      <div
        key={`field-${field.id}`}
        className={field.id in props.fieldsErrors ? "form-error mt" : "mt"}
      >
        {(field.fieldType === "text" ||
          field.fieldType === "email" ||
          field.fieldType === "number") && (
          <InputField
            required={field.required}
            label={field.label}
            description={field.description}
            disabled={props.disabled}
            type={field.fieldType}
            min={
              field.extra && "min" in field.extra
                ? Number(field.extra.min)
                : undefined
            }
            max={
              field.extra && "max" in field.extra
                ? Number(field.extra.max)
                : undefined
            }
            value={props.fieldsValues[field.id] as string}
            setValue={(v: string) => setFieldValue(field.id, v)}
          />
        )}
        {field.fieldType === "radio" && (
          <RadioField
            required={field.required}
            label={field.label}
            description={field.description}
            disabled={props.disabled}
            options={(field as RadioFieldType).extra.options}
            value={props.fieldsValues[field.id] as string}
            setValue={(v: string) => setFieldValue(field.id, v)}
          />
        )}
        {field.fieldType === "dropdown" && (
          <DropdownField
            required={field.required}
            label={field.label}
            description={field.description}
            disabled={props.disabled}
            options={(field as DropdownFieldType).extra.options}
            multiple={(field as DropdownFieldType).extra.multiple}
            value={props.fieldsValues[field.id] as string | string[]}
            setValue={(v: string | string[]) => setFieldValue(field.id, v)}
          />
        )}
        {field.fieldType === "checkbox" && (
          <CheckboxField
            required={field.required}
            label={field.label}
            description={field.description}
            disabled={props.disabled}
            value={props.fieldsValues[field.id] as boolean}
            setValue={(v: boolean) => setFieldValue(field.id, v)}
          />
        )}
        {field.fieldType === "privacy" && (
          <PrivacyField
            required={field.required}
            label={field.label}
            disabled={props.disabled}
            value={props.fieldsValues[field.id] as boolean}
            setValue={(v: boolean) => setFieldValue(field.id, v)}
            privacyUrl={(field as PrivacyFieldType).extra?.url}
          />
        )}
        {field.id.toString() in props.fieldsErrors && (
          <span className="error-text">{props.fieldsErrors[field.id]}</span>
        )}
      </div>
    );
  });
};

export default FormFields;
