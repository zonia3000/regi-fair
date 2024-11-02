import React, { useEffect, useRef, useState } from "react";
import { __ } from "@wordpress/i18n";
import { EditFieldProps } from "../../classes/components-props";
import "../../style.css";
import { CheckboxField } from "../../classes/fields";
import { TextControl } from "@wordpress/components";

const EditCheckboxField = (props: EditFieldProps<CheckboxField>) => {
  const [initializing, setInitializing] = useState(true);
  const [fieldLabel, setFieldLabel] = useState("");
  const fieldLabelRef = useRef(fieldLabel);
  const [fieldDescription, setFieldDescription] = useState("");
  const [valid, setValid] = useState(true);

  useEffect(() => {
    setInitializing(true);

    if (props.field === null) {
      const field: CheckboxField = {
        label: "",
        fieldType: "checkbox",
        required: false,
        description: "",
        validate,
      };
      props.setField(field);
    } else {
      const field: CheckboxField = {
        ...props.field,
        validate,
      };
      setFieldLabel(props.field.label);
      setFieldDescription(props.field.description);
      props.setField(field);
    }

    setInitializing(false);
  }, []);

  useEffect(() => {
    fieldLabelRef.current = fieldLabel;
  }, [fieldLabel]);

  function validate() {
    const valid = fieldLabelRef.current.trim() !== "";
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

  if (initializing) {
    return;
  }

  return (
    <>
      <div className={!valid && !fieldLabel.trim() ? "form-error" : ""}>
        <TextControl
          label={__("Label", "regi-fair")}
          onChange={saveFieldLabel}
          value={fieldLabel}
          required
          className="mb"
          __nextHasNoMarginBottom={true}
        />
        {!valid && !fieldLabel.trim() && (
          <span className="error-text">
            {__("Field is required", "regi-fair")}
          </span>
        )}
      </div>
      <TextControl
        label={__("Description (optional)", "regi-fair")}
        onChange={saveFieldDescription}
        value={fieldDescription}
        required
        className="mb"
        __nextHasNoMarginBottom={true}
      />
    </>
  );
};

export default EditCheckboxField;
