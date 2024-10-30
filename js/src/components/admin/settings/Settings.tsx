import React, { useEffect, useState } from "react";
import { __ } from "@wordpress/i18n";
import { type Settings as SettingsType } from "../../classes/settings";
import apiFetch from "@wordpress/api-fetch";
import { extractError } from "../../utils";
import Loading from "../../Loading";
import {
  Button,
  Notice,
  Spinner,
  TextControl,
  TextareaControl,
} from "@wordpress/components";
import "../../style.css";

const Settings = function () {
  const [loading, setLoading] = useState(true);
  const [defaultAdminEmail, setDefaultAdminEmail] = useState("");
  const [defaultAutoremovePeriod, setDefaultAutoremovePeriod] = useState("30");
  const [defaultExtraEmailContent, setDefaultExtraEmailContent] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch({ path: `/wpoe/v1/admin/settings` })
      .then((result) => {
        const settings = result as SettingsType;
        setDefaultAdminEmail(settings.defaultAdminEmail);
        setDefaultAutoremovePeriod(settings.defaultAutoremovePeriod.toString());
        setDefaultExtraEmailContent(settings.defaultExtraEmailContent);
        setFromEmail(settings.fromEmail);
      })
      .catch((err) => {
        setError(extractError(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    setUpdated(false);
    setError("");
    try {
      const response = await apiFetch({
        path: `/wpoe/v1/admin/settings`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          defaultAdminEmail,
          defaultAutoremovePeriod: Number(defaultAutoremovePeriod),
          defaultExtraEmailContent,
          fromEmail,
        }),
      });
      setDefaultExtraEmailContent(
        (response as SettingsType).defaultExtraEmailContent,
      );
      setUpdated(true);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="wrap">
      <h1>Settings</h1>
      <p>
        <em>
          {__(
            "All the following options are just defaults and they can be redefined for each event",
            "wp-open-events",
          )}
        </em>
      </p>
      <TextControl
        label={__("Default event admin e-mail address", "wp-open-events")}
        onChange={setDefaultAdminEmail}
        value={defaultAdminEmail}
        type="email"
        className="mb"
        help={__(
          "Received registrations will be notified at this addres",
          "wp-open-events",
        )}
        __nextHasNoMarginBottom={true}
      />

      <TextControl
        label={__("Default autoremove period", "wp-open-events")}
        onChange={setDefaultAutoremovePeriod}
        value={defaultAutoremovePeriod}
        type="number"
        className="mb"
        help={__(
          "Number of days to wait after the event conclusion before removing registrations data",
          "wp-open-events",
        )}
        __nextHasNoMarginBottom={true}
      />

      <TextareaControl
        label={__(
          "Default extra content for confirmation e-mail messages",
          "wp-open-events",
        )}
        onChange={setDefaultExtraEmailContent}
        value={defaultExtraEmailContent}
        className="mb"
        help={__(
          "This content will be added at the end of the confirmation e-mail messages. Allowed HTML tags: <b>, <i>, <a>, <hr>, <p>, <br>",
          "wp-open-events",
        )}
        __nextHasNoMarginBottom={true}
      />

      <TextControl
        label={__(
          "E-mail address used to send confirmation messages to users",
          "wp-open-events",
        )}
        onChange={setFromEmail}
        value={fromEmail}
        type="text"
        className="mb"
        __nextHasNoMarginBottom={true}
      />

      {error && (
        <div className="mt-2 mb">
          <Notice status="error" isDismissible={false}>
            {error}
          </Notice>
        </div>
      )}

      {updated && (
        <Notice status="success" className="mt-2 mb" isDismissible={false}>
          {__("Settings updated", "wp-open-events")}
        </Notice>
      )}

      <Button onClick={save} variant="primary" disabled={saving} className="mt">
        {saving && <Spinner />}
        {__("Save", "wp-open-events")}
      </Button>
    </div>
  );
};

export default Settings;
