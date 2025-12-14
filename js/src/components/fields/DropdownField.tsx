import React from "react";
import { SelectControl } from "@wordpress/components";
import { DropdownFieldProps } from "../classes/components-props";
import { __ } from "@wordpress/i18n";

const DropdownField = (props: DropdownFieldProps) => {
  function onChange(values: string | string[]) {
    props.setValue(values);
  }

  if (props.multiple) {
    return (
      <SelectControl
        label={
          props.label +
          (props.required ? "" : ` (${__("optional", "regi-fair")})`)
        }
        disabled={!!props.disabled}
        options={props.options.map((p) => ({ label: p, value: p }))}
        onChange={onChange}
        value={props.value as string[]}
        __nextHasNoMarginBottom={true}
        __next40pxDefaultSize={true}
        className="mb"
        multiple
        help={props.description}
      />
    );
  } else {
    return (
      <SelectControl
        label={
          props.label +
          (props.required ? "" : ` (${__("optional", "regi-fair")})`)
        }
        disabled={!!props.disabled}
        options={[
          {
            disabled: true,
            label: __("Select...", "regi-fair"),
            value: "",
          },
          ...props.options.map((p) => ({ label: p, value: p })),
        ]}
        onChange={onChange}
        value={props.value as string}
        __nextHasNoMarginBottom={true}
        __next40pxDefaultSize={true}
        className="mb"
        help={props.description}
      />
    );
  }
};

export default DropdownField;
