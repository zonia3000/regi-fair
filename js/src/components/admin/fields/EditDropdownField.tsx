import React, { useEffect, useRef, useState } from "react";
import { Button, CheckboxControl, TextControl } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import { EditDropdownFieldProps } from "../../classes/components-props";
import "../../style.css";

const EditDropdownField = (props: EditDropdownFieldProps) => {
  const [initializing, setInitializing] = useState(true);
  const [fieldLabel, setFieldLabel] = useState("");
  const fieldLabelRef = useRef(fieldLabel);
  const [fieldDescription, setFieldDescription] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldMultiple, setFieldMultiple] = useState(false);
  const [options, setOptions] = useState([]);
  const optionsRef = useRef(options);
  const [valid, setValid] = useState(true);

  useEffect(() => {
    if (props.field === null) {
      props.setField({
        label: "",
        fieldType: "dropdown",
        required: false,
        description: "",
        extra: {
          options: [],
          multiple: false,
        },
        validate,
      });
    } else {
      props.setField({
        ...props.field,
        validate,
      });
      setFieldLabel(props.field.label);
      setFieldDescription(props.field.description);
      setFieldRequired(props.field.required);
      setOptions(props.field.extra.options);
      setFieldMultiple(props.field.extra.multiple);
    }
    setInitializing(false);
  }, []);

  useEffect(() => {
    fieldLabelRef.current = fieldLabel;
    optionsRef.current = options;
  }, [fieldLabel, options]);

  function validate() {
    const valid =
      fieldLabelRef.current !== "" &&
      optionsRef.current.filter((o) => o.trim() === "").length === 0;
    setValid(valid);
    return valid;
  }

  function saveFieldLabel(value: string) {
    setFieldLabel(value);
    props.setField({
      ...props.field,
      label: value,
      validate,
    });
  }

  function saveFieldDescription(value: string) {
    setFieldDescription(value);
    props.setField({
      ...props.field,
      description: value,
      validate,
    });
  }

  function saveFieldRequired(value: boolean) {
    setFieldRequired(value);
    props.setField({
      ...props.field,
      required: value,
      validate,
    });
  }

  function saveFieldMultiple(value: boolean) {
    setFieldMultiple(value);
    props.setField({
      ...props.field,
      extra: { ...props.field.extra, multiple: value },
      validate,
    });
  }

  function addOption() {
    updateOptions([...options, ""]);
  }

  function removeOption(index: number) {
    updateOptions(options.filter((_, i) => i !== index));
  }

  function saveFieldOptions(value: string, index: number) {
    updateOptions(options.map((o, i) => (i === index ? value : o)));
  }

  function updateOptions(updatedOptions: string[]) {
    setOptions(updatedOptions);
    props.setField({
      ...props.field,
      extra: { options: updatedOptions, multiple: props.field.extra.multiple },
      validate,
    });
  }

  if (initializing) {
    return;
  }

  return (
    <>
      <div className={!valid && !fieldLabel.trim() ? "form-error" : ""}>
        <TextControl
          label={__("Label", "wp-open-events")}
          onChange={saveFieldLabel}
          value={fieldLabel}
          required
          className="mb"
          __nextHasNoMarginBottom={true}
        />
        {!valid && !fieldLabel.trim() && (
          <span className="error-text">
            {__("Field is required", "wp-open-events")}
          </span>
        )}
      </div>
      <TextControl
        label={__("Description (optional)", "wp-open-events")}
        onChange={saveFieldDescription}
        value={fieldDescription}
        required
        className="mb"
        __nextHasNoMarginBottom={true}
      />
      <CheckboxControl
        label={__("Required", "wp-open-events")}
        checked={fieldRequired}
        onChange={saveFieldRequired}
        className={"mt-2 mb-2"}
        __nextHasNoMarginBottom={true}
      />
      <CheckboxControl
        label={__("Multiple", "wp-open-events")}
        checked={fieldMultiple}
        onChange={saveFieldMultiple}
        className={"mt-2 mb-2"}
        __nextHasNoMarginBottom={true}
      />
      {options.map((option, index) => {
        return (
          <div
            className={
              !valid && !option.trim()
                ? "form-error edit-radio-option-wrapper"
                : "edit-radio-option-wrapper"
            }
            key={index}
          >
            <TextControl
              label={__("Option", "wp-open-events") + " " + (index + 1)}
              onChange={(value) => saveFieldOptions(value, index)}
              value={option}
              required
              className="mb"
              __nextHasNoMarginBottom={true}
            />
            <Button
              aria-label={__("Remove option", "wp-open-events")}
              onClick={() => removeOption(index)}
              className="remove-option-btn"
            >
              &times;
            </Button>
            {!valid && !option.trim() && (
              <span className="error-text">
                {__("Field is required", "wp-open-events")}
              </span>
            )}
          </div>
        );
      })}
      <Button onClick={addOption} variant="primary">
        {__("Add option", "wp-open-events")}
      </Button>
      <br />
    </>
  );
};

export default EditDropdownField;
