import React from "react";
import { CheckboxControl } from "@wordpress/components";
import { PrivacyFieldProps } from "../classes/components-props";
import { __, sprintf } from "@wordpress/i18n";

const PrivacyField = (props: PrivacyFieldProps) => {
  function onChange(value: boolean) {
    props.setValue(value);
  }

  function getPrivacyPolicyHtmlLabel() {
    let safeUrl = "";
    try {
      safeUrl = new URL(props.privacyUrl).toString();
    } catch {
      console.warn("Invalid privacy policy URL");
    }

    return sprintf(
      /* translators: The %s placeholders will be replaced with HTML tags used for creating a link to the privacy policy page */
      __("I accept the %sprivacy policy%s", "regi-fair"),
      `<a href="${safeUrl}">`,
      "</a>"
    );
  }

  return (
    <div className="regi-fair-privacy-field">
      <CheckboxControl
        __nextHasNoMarginBottom
        id="privacy-policy-checkbox"
        disabled={!!props.disabled}
        onChange={onChange}
        checked={props.value}
        className="mt mb"
      />
      <label
        htmlFor="privacy-policy-checkbox"
        dangerouslySetInnerHTML={{ __html: getPrivacyPolicyHtmlLabel() }}
      ></label>
    </div>
  );
};

export default PrivacyField;
