import React from "react";
import { CheckboxControl } from "@wordpress/components";
import { PrivacyFieldProps } from "../classes/components-props";
import { __, sprintf } from "@wordpress/i18n";
import {
  __experimentalHStack as HStack,
  __experimentalVStack as VStack,
} from "@wordpress/components";

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
      "</a>",
    );
  }

  return (
    <HStack alignment="top" justify="flex-start" spacing={0}>
      <CheckboxControl
        __nextHasNoMarginBottom
        id="privacy-policy-checkbox"
        disabled={!!props.disabled}
        onChange={onChange}
        checked={props.value}
        className="mb"
      />
      <VStack>
        <label
          htmlFor="privacy-policy-checkbox"
          dangerouslySetInnerHTML={{ __html: getPrivacyPolicyHtmlLabel() }}
        ></label>
      </VStack>
    </HStack>
  );
};

export default PrivacyField;
