import React from "react";
import { CheckboxControl } from "@wordpress/components";
import { CheckboxFieldProps } from "../classes/components-props";
import { __ } from "@wordpress/i18n";

const CheckboxField = (props: CheckboxFieldProps) => {
  function onChange(value: boolean) {
    props.setValue(value);
  }

  return (
    <CheckboxControl
      label={props.label}
      disabled={!!props.disabled}
      onChange={onChange}
      checked={props.value}
      __nextHasNoMarginBottom={true}
      className="mb"
    />
  );
};

export default CheckboxField;
