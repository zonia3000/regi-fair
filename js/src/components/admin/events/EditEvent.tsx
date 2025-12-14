import React, { useState, useEffect } from "react";
import {
  Button,
  TextControl,
  CheckboxControl,
  BaseControl,
  Notice,
  TextareaControl,
} from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import Loading from "../../Loading";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import EditFormFields from "../fields/EditFormFields";
import { checkErrorCode, cleanupFields, extractError } from "../../utils";
import { Settings } from "../../classes/settings";
import { EventConfiguration } from "../../classes/event";
import { TemplateConfiguration } from "../../classes/template";
import { Field } from "../../classes/fields";

const EditEvent = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [autoremove, setAutoremove] = useState(true);
  const [autoremovePeriod, setAutoremovePeriod] = useState("");
  const [formFields, setFormFields] = useState([] as Field[]);
  const [hasResponses, setHasResponses] = useState(false);
  const [hasMaxParticipants, setHasMaxParticipants] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("");
  const [hasWaitingList, setHasWaitingList] = useState(false);
  const [notifyAdmin, setNotifyAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [editableRegistrations, setEditableRegistrations] = useState(true);
  const [customizeEmailContent, setCustomizeEmailContent] = useState(false);
  const [emailExtraContent, setEmailExtraContent] = useState("");
  const [error, setError] = useState("");
  const [valid, setValid] = useState(true);

  /**
   * Returns a string representing tomorrow date in format YYYY-MM-DD.
   */
  function getTomorrowDate() {
    const now = new Date();
    const nowWithoutTime = now.toISOString().substring(0, 10);
    const tomorrow = new Date(nowWithoutTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().substring(0, 10);
  }

  useEffect(() => {
    if (eventId === "new") {
      setLoading(true);
      setFound(true);
      setDate(getTomorrowDate());
      const templateId = searchParams.get("template");
      if (templateId) {
        apiFetch({ path: `/regifair/v1/admin/templates/${templateId}` })
          .then((result) => {
            const template = result as TemplateConfiguration;
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
            setError(extractError(err));
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        // New event from scratch, load global settings
        apiFetch({ path: `/regifair/v1/admin/settings` })
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
      }
    } else {
      setLoading(true);
      apiFetch({ path: `/regifair/v1/admin/events/${eventId}` })
        .then((result) => {
          setFound(true);
          const event = result as EventConfiguration;
          setEventName(event.name);
          setDate(event.date);
          setAutoremove(event.autoremove);
          if (event.autoremove) {
            setAutoremovePeriod(event.autoremovePeriod.toString());
          }
          setFormFields(event.formFields);
          setHasResponses(event.hasResponses || false);
          if (event.maxParticipants) {
            setHasMaxParticipants(true);
            setMaxParticipants(event.maxParticipants.toString());
            setHasWaitingList(event.waitingList);
          }
          if (event.adminEmail) {
            setNotifyAdmin(true);
            setAdminEmail(event.adminEmail);
          }
          setEditableRegistrations(event.editableRegistrations);
          if (event.extraEmailContent) {
            setCustomizeEmailContent(true);
            setEmailExtraContent(event.extraEmailContent);
          }
        })
        .catch((err) => {
          if (checkErrorCode(err, "event_not_found")) {
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
    const event: EventConfiguration = {
      id: eventId === "new" ? null : Number(eventId),
      name: eventName,
      date: parseDate(),
      adminEmail: notifyAdmin ? adminEmail.trim() : null,
      editableRegistrations,
      formFields,
      autoremove: autoremove,
      autoremovePeriod: autoremove ? Number(autoremovePeriod) : null,
      maxParticipants: hasMaxParticipants ? Number(maxParticipants) : null,
      waitingList: hasMaxParticipants ? hasWaitingList : false,
      extraEmailContent: customizeEmailContent
        ? emailExtraContent.trim()
        : null,
      ended: false,
    };
    setLoading(true);
    try {
      if (eventId === "new") {
        await apiFetch({
          path: "/regifair/v1/admin/events",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...event,
            formFields: cleanupFields(event.formFields),
          }),
        });
      } else {
        await apiFetch({
          path: `/regifair/v1/admin/events/${eventId}`,
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...event,
            formFields: cleanupFields(event.formFields),
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
    if (!eventName.trim()) {
      return false;
    }
    if (!date) {
      return false;
    }
    if (hasMaxParticipants && !maxParticipants) {
      return false;
    }
    if (notifyAdmin && !adminEmail) {
      return false;
    }
    return true;
  }

  function parseDate() {
    return new Date(date).toISOString();
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
      return <p>{__("Event not found", "regi-fair")}</p>;
    }
  }

  return (
    <div>
      <h1>
        {eventId === "new"
          ? __("Create event", "regi-fair")
          : __("Edit event", "regi-fair")}
      </h1>
      <div className={!valid && !eventName.trim() ? "form-error" : ""}>
        <TextControl
          label={__("Name", "regi-fair")}
          onChange={setEventName}
          value={eventName}
          required
          className="mb"
          __nextHasNoMarginBottom={true}
          __next40pxDefaultSize={true}
        />
        {!valid && !eventName.trim() && (
          <span className="error-text">
            {__("Field is required", "regi-fair")}
          </span>
        )}
      </div>
      <div className={!valid && !date ? "form-error" : ""}>
        <BaseControl
          label={__("Date", "regi-fair")}
          __nextHasNoMarginBottom={true}
          id="eventDate"
        >
          <input
            type="date"
            id="eventDate"
            className="components-text-control__input mb"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </BaseControl>
        {!valid && !date && (
          <span className="error-text">
            {__("Field is required", "regi-fair")}
          </span>
        )}
      </div>
      {hasResponses && (
        <div className="mt-2 mb">
          <Notice status="warning" isDismissible={false}>
            <strong>{__("Warning")}</strong>: &nbsp;
            {__(
              "this event has already some registrations. Adding or removing fields can result in having some empty values in your registrations table.",
              "regi-fair"
            )}
          </Notice>
        </div>
      )}
      <EditFormFields formFields={formFields} setFormFields={setFormFields} />
      <br />
      <br />
      <CheckboxControl
        label={__("Set a maximum number of participants", "regi-fair")}
        checked={hasMaxParticipants}
        onChange={setHasMaxParticipants}
        className="mb"
        __nextHasNoMarginBottom={true}
      />
      {hasMaxParticipants && (
        <>
          <div className={!valid && !maxParticipants ? "form-error" : ""}>
            <TextControl
              label={__("Total available seats", "regi-fair")}
              onChange={setMaxParticipants}
              value={maxParticipants}
              type="number"
              required
              className="mb"
              __nextHasNoMarginBottom={true}
              __next40pxDefaultSize={true}
            />
            {!valid && !maxParticipants && (
              <span className="error-text">
                {__("Field is required", "regi-fair")}
              </span>
            )}
          </div>
          <CheckboxControl
            label={__(
              "Enable waiting list when maximum number of participants has been reached",
              "regi-fair"
            )}
            checked={hasWaitingList}
            onChange={setHasWaitingList}
            className="mb"
            __nextHasNoMarginBottom={true}
          />
        </>
      )}
      <CheckboxControl
        label={__("Autoremove user data after the event", "regi-fair")}
        checked={autoremove}
        onChange={setAutoremove}
        className="mb"
        __nextHasNoMarginBottom={true}
      />
      {autoremove && (
        <TextControl
          label={__("Autoremove period", "regi-fair")}
          onChange={setAutoremovePeriod}
          value={autoremovePeriod}
          type="number"
          required
          className="mb"
          help={__(
            "Number of days to wait after the event conclusion before removing registrations data",
            "regi-fair"
          )}
          __nextHasNoMarginBottom={true}
          __next40pxDefaultSize={true}
        />
      )}
      {autoremove && !valid && !autoremovePeriod && (
        <span className="error-text">
          {__("Field is required", "regi-fair")}
        </span>
      )}
      <CheckboxControl
        label={__(
          "Allow the users to edit or delete their registrations",
          "regi-fair"
        )}
        checked={editableRegistrations}
        onChange={setEditableRegistrations}
        className="mb"
        __nextHasNoMarginBottom={true}
      />
      <CheckboxControl
        label={__(
          "Notify an administrator by e-mail when a new registration is created",
          "regi-fair"
        )}
        checked={notifyAdmin}
        onChange={setNotifyAdmin}
        className="mb"
        __nextHasNoMarginBottom={true}
      />
      {notifyAdmin && (
        <div className={!valid && !adminEmail ? "form-error" : ""}>
          <TextControl
            label={__("Administrator e-mail address", "regi-fair")}
            onChange={setAdminEmail}
            value={adminEmail}
            required
            className="mb"
            __nextHasNoMarginBottom={true}
            __next40pxDefaultSize={true}
          />
          {!valid && !adminEmail && (
            <span className="error-text">
              {__("Field is required", "regi-fair")}
            </span>
          )}
        </div>
      )}
      <CheckboxControl
        label={__("Add custom message to confirmation e-mail", "regi-fair")}
        checked={customizeEmailContent}
        onChange={setCustomizeEmailContent}
        className="mb"
        __nextHasNoMarginBottom={true}
      />
      {customizeEmailContent && (
        <TextareaControl
          label={__("Custom confirmation e-mail content", "regi-fair")}
          onChange={setEmailExtraContent}
          value={emailExtraContent}
          help={__(
            "This content will be added at the end of the confirmation e-mail messages. Allowed HTML tags: <b>, <i>, <a>, <hr>, <p>, <br>",
            "regi-fair"
          )}
          className="mb"
          __nextHasNoMarginBottom={true}
        />
      )}
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
        {__("Save", "regi-fair")}
      </Button>
      &nbsp;
      <Button onClick={back} variant="secondary">
        {__("Back", "regi-fair")}
      </Button>
    </div>
  );
};

export default EditEvent;
