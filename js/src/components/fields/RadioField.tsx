import React from "react";
import { RadioControl } from "@wordpress/components";
import { RadioFieldProps } from "../classes/components-props";
import { __ } from "@wordpress/i18n";

const RadioField = (props: RadioFieldProps) => {
  function onChange(value: string) {
    props.setValue(value);
  }

  return (
    <RadioControl
      label={
        props.label +
        (props.required ? "" : ` (${__("optional", "regi-fair")})`)
      }
      options={props.options.map((p) => ({ label: p, value: p }))}
      disabled={!!props.disabled}
      onChange={onChange}
      selected={props.value}
      help={props.description}
      className="mb"
    />
  );
};

export default RadioField;
