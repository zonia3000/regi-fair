import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import Loading from "../../Loading";
import { useNavigate, useParams } from "react-router-dom";
import EditFormFields from "../fields/EditFormFields";
import {
  Button,
  CheckboxControl,
  Notice,
  TextControl,
  TextareaControl,
} from "@wordpress/components";
import { cleanupFields, extractError } from "../../utils";
import "../../style.css";
import { Settings } from "../../classes/settings";
import { TemplateConfiguration } from "../../classes/template";

const EditTemplate = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [autoremove, setAutoremove] = useState(true);
  const [autoremovePeriod, setAutoremovePeriod] = useState("");
  const [formFields, setFormFields] = useState([]);
  const [notifyAdmin, setNotifyAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [editableRegistrations, setEditableRegistrations] = useState(true);
  const [customizeEmailContent, setCustomizeEmailContent] = useState(false);
  const [emailExtraContent, setEmailExtraContent] = useState("");
  const [error, setError] = useState("");
  const [valid, setValid] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (templateId === "new") {
      setFound(true);
      apiFetch({ path: `/wpoe/v1/admin/settings` })
        .then((result) => {
          const settings = result as Settings;
          if (settings.defaultAdminEmail) {
            setNotifyAdmin(true);
            setAdminEmail(settings.defaultAdminEmail);
          }
          if (settings.defaultExtraEmailContent) {
            setCustomizeEmailContent(true);
            setEmailExtraContent(settings.defaultExtraEmailContent);
          }
          setAutoremovePeriod(settings.defaultAutoremovePeriod.toString());
        })
        .catch((err) => {
          setError(extractError(err));
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      apiFetch({ path: `/wpoe/v1/admin/templates/${templateId}` })
        .then((result) => {
          setFound(true);
          const template = result as TemplateConfiguration;
          setTemplateName(template.name);
          setAutoremove(template.autoremove);
          if (template.autoremove) {
            setAutoremovePeriod(template.autoremovePeriod.toString());
          }
          setFormFields(template.formFields);
          if (template.adminEmail) {
            setNotifyAdmin(true);
            setAdminEmail(template.adminEmail);
          }
          setEditableRegistrations(template.editableRegistrations);
          if (template.extraEmailContent) {
            setCustomizeEmailContent(true);
            setEmailExtraContent(template.extraEmailContent);
          }
        })
        .catch((err) => {
          if (err.code === "template_not_found") {
            setFound(false);
          } else {
            setError(extractError(err));
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  async function save() {
    const valid = validate();
    setValid(valid);
    if (!valid) {
      return;
    }
    const template: TemplateConfiguration = {
      id: templateId === "new" ? null : Number(templateId),
      name: templateName,
      formFields,
      autoremove,
      autoremovePeriod: autoremove ? Number(autoremovePeriod) : null,
      waitingList: false,
      adminEmail: notifyAdmin ? adminEmail.trim() : null,
      editableRegistrations,
      extraEmailContent: customizeEmailContent
        ? emailExtraContent.trim()
        : null,
    };
    setLoading(true);
    try {
      if (templateId === "new") {
        await apiFetch({
          path: "/wpoe/v1/admin/templates",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...template,
            formFields: cleanupFields(template.formFields),
          }),
        });
      } else {
        await apiFetch({
          path: `/wpoe/v1/admin/templates/${templateId}`,
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...template,
            formFields: cleanupFields(template.formFields),
          }),
        });
      }
      back();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  function validate() {
    if (!templateName.trim()) {
      return false;
    }
    if (notifyAdmin && !adminEmail.trim()) {
      return false;
    }
    return true;
  }

  function back() {
    navigate("/");
  }

  if (loading) {
    return <Loading />;
  }

  if (!found) {
    if (error) {
      return (
        <div className="mb">
          <Notice status="error" isDismissible={false}>
            {error}
          </Notice>
        </div>
      );
    } else {
      return <p>{__("Template not found", "wp-open-events")}</p>;
    }
  }

  return (
    <div>
      <h1>
        {templateId === "new"
          ? __("Create template", "wp-open-events")
          : __("Edit template", "wp-open-events")}
      </h1>
      <div className={!valid && !templateName.trim() ? "form-error" : ""}>
        <TextControl
          label={__("Name", "wp-open-events")}
          onChange={setTemplateName}
          value={templateName}
          required
          className="mb"
          __nextHasNoMarginBottom={true}
        />
        {!valid && !templateName.trim() && (
          <span className="error-text">
            {__("Field is required", "wp-open-events")}
          </span>
        )}
      </div>
      <CheckboxControl
        label={__("Autoremove user data after the event", "wp-open-events")}
        checked={autoremove}
        onChange={setAutoremove}
        className="mb"
        __nextHasNoMarginBottom={true}
      />
      {autoremove &&
        <TextControl
          label={__("Autoremove period", "wp-open-events")}
          onChange={setAutoremovePeriod}
          value={autoremovePeriod}
          type="number"
          required
          className="mb"
          help={__("Number of days to wait after the event conclusion before removing registrations data", "wp-open-events")}
          __nextHasNoMarginBottom={true}
        />
      }
      {autoremove && !valid && !autoremovePeriod && (
        <span className="error-text">
          {__("Field is required", "wp-open-events")}
        </span>
      )}
      <CheckboxControl
        label={__(
          "Allow the users to edit or delete their registrations",
          "wp-open-events",
        )}
        checked={editableRegistrations}
        onChange={setEditableRegistrations}
        className="mb"
        __nextHasNoMarginBottom={true}
      />
      <CheckboxControl
        label={__(
          "Notify an administrator by e-mail when a new registration is created",
          "wp-open-events",
        )}
        checked={notifyAdmin}
        onChange={setNotifyAdmin}
        className="mb"
        __nextHasNoMarginBottom={true}
      />
      {notifyAdmin && (
        <div className={!valid && !adminEmail.trim() ? "form-error" : ""}>
          <TextControl
            label={__("Administrator e-mail address", "wp-open-events")}
            onChange={setAdminEmail}
            value={adminEmail}
            required
            className="mb"
            __nextHasNoMarginBottom={true}
          />
          {!valid && !adminEmail.trim() && (
            <span className="error-text">
              {__("Field is required", "wp-open-events")}
            </span>
          )}
        </div>
      )}
      <CheckboxControl
        label={__(
          "Add custom message to confirmation e-mail",
          "wp-open-events",
        )}
        checked={customizeEmailContent}
        onChange={setCustomizeEmailContent}
        className="mb"
        __nextHasNoMarginBottom={true}
      />
      {customizeEmailContent && (
        <TextareaControl
          label={__("Custom confirmation e-mail content", "wp-open-events")}
          onChange={setEmailExtraContent}
          value={emailExtraContent}
          help={__(
            "This content will be added at the end of the confirmation e-mail messages. Allowed HTML tags: <b>, <i>, <a>, <hr>, <p>, <br>",
            "wp-open-events",
          )}
          className="mb"
          __nextHasNoMarginBottom={true}
        />
      )}
      <EditFormFields formFields={formFields} setFormFields={setFormFields} />
      <br />
      <hr />
      {error && (
        <div className="mb">
          <Notice status="error" isDismissible={false}>
            {error}
          </Notice>
        </div>
      )}
      <Button onClick={save} variant="primary">
        {__("Save", "wp-open-events")}
      </Button>
      &nbsp;
      <Button onClick={back} variant="secondary">
        {__("Back", "wp-open-events")}
      </Button>
    </div>
  );
};

export default EditTemplate;
