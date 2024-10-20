import React, { useEffect, useState } from "react";
import { Notice } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import { EditFieldProps } from "../../classes/components-props";
import "../../style.css";
import { PrivacyField } from "../../classes/fields";
import apiFetch from "@wordpress/api-fetch";
import { Settings } from "../../classes/settings";
import { extractError } from "../../utils";

const EditPrivacyPolicyField = (props: EditFieldProps<PrivacyField>) => {
  const [initializing, setInitializing] = useState(true);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setInitializing(true);

    if (props.field === null) {
      const field: PrivacyField = {
        label: "privacy",
        fieldType: "privacy",
        required: true,
        validate,
      };
      props.setField(field);
    } else {
      const field: PrivacyField = {
        ...props.field,
        validate,
      };
      props.setField(field);
    }

    apiFetch({ path: `/wpoe/v1/admin/settings` })
      .then((result) => {
        const settings = result as Settings;
        setPrivacyPolicyUrl(settings.privacyPolicyUrl);
      })
      .catch((err) => {
        setError(extractError(err));
      })
      .finally(() => {
        setInitializing(false);
      });
  }, []);

  function validate() {
    return true;
  }

  if (initializing) {
    return;
  }

  if (error) {
    return (
      <div className="mb">
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      </div>
    );
  }

  if (privacyPolicyUrl === "") {
    return (
      <Notice status="warning" className="mt-2" isDismissible={false}>
        {__(
          "No privacy policy URL configured! Please set one!",
          "wp-open-events",
        )}
      </Notice>
    );
  }

  if (privacyPolicyUrl !== "") {
    return (
      <p>
        {__("Configured privacy policy URL:", "wp-open-events")}
        &nbsp;
        <a href={privacyPolicyUrl}>{__("Privacy Policy", "wp-open-events")}</a>
      </p>
    );
  }
};

export default EditPrivacyPolicyField;
