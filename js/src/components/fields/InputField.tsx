import React from "react";
import { TextControl } from "@wordpress/components";
import { InputFieldProps } from "../classes/components-props";
import { __ } from "@wordpress/i18n";

const InputField = (props: InputFieldProps) => {
  function onChange(value: string) {
    props.setValue(value);
  }

  return (
    <TextControl
      label={
        props.label +
        (props.required ? "" : ` (${__("optional", "regi-fair")})`)
      }
      onChange={onChange}
      value={props.value}
      type={props.type}
      min={props.min}
      max={props.max}
      disabled={!!props.disabled}
      help={props.description}
      className="mb"
      __nextHasNoMarginBottom={true}
      __next40pxDefaultSize={true}
    />
  );
};

export default InputField;
