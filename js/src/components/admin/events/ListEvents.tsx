import React, { useState, useEffect } from "react";
import { __ } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";
import Loading from "../../Loading";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Icon,
  Modal,
  Notice,
  SelectControl,
  Spinner,
} from "@wordpress/components";
import { extractError } from "../../utils";
import "../../style.css";
import { EventConfiguration } from "../../classes/event";
import { TemplateConfiguration } from "../../classes/template";

const ListEvents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([] as EventConfiguration[]);
  const [error, setError] = useState("");
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [chooseTemplate, setChooseTemplate] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templates, setTemplates] = useState(
    [] as Array<{ value: string; label: string }>
  );
  const [templatesError, setTemplatesError] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [eventToDelete, setEventToDelete] = useState(
    null as EventConfiguration | null
  );
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [
    selectedEventWithMultipleReferences,
    setSelectedEventWithMultipleReferences,
  ] = useState(null as EventConfiguration | null);
  const [loadingEventReferences, setLoadingEventReferences] = useState(false);
  const [loadingEventReferencesError, setLoadingEventReferencesError] =
    useState("");
  const [referencingPosts, setReferencingPosts] = useState(
    [] as Array<{ title: string; permalink: string }>
  );

  useEffect(() => {
    setLoading(true);
    apiFetch({ path: "/regifair/v1/admin/events" })
      .then((result) => {
        setEvents(result as EventConfiguration[]);
      })
      .catch((err) => {
        setError(extractError(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function newEventFromScratch() {
    navigate("/event/new");
  }

  function newEventFromTemplate() {
    navigate(`/event/new?template=${selectedTemplateId}`);
  }

  function openCreateEventModal() {
    setShowCreateEventModal(true);
  }

  function closeCreateEventModal() {
    setShowCreateEventModal(false);
    setChooseTemplate(false);
    setSelectedTemplateId("");
  }

  async function loadTemplates() {
    setChooseTemplate(true);
    setTemplatesLoading(true);
    try {
      const result = await apiFetch({ path: "/regifair/v1/admin/templates" });
      const templates = (result as TemplateConfiguration[]).map((template) => {
        return {
          value: template.id.toString(),
          label: template.name,
        };
      });
      if (templates.length > 0) {
        setSelectedTemplateId(templates[0].value);
      }
      setTemplates(templates);
    } catch (err) {
      setTemplatesError(extractError(err));
    } finally {
      setTemplatesLoading(false);
    }
  }

  function openCreateTemplatePage() {
    const newTemplatePage = window.location
      .toString()
      .replace(/=regi-fair-events.*/, "=regi-fair-templates#/template/new");
    window.location.href = newTemplatePage;
  }

  function openDeleteEventModal(event: EventConfiguration) {
    setEventToDelete(event);
  }

  function closeDeleteEventModal() {
    setEventToDelete(null);
    setDeleteError("");
    setLoadingEventReferencesError("");
    setReferencingPosts([]);
    setLoadingEventReferences(false);
  }

  async function confirmDeleteEvent() {
    setDeleting(true);
    try {
      await apiFetch({
        path: `/regifair/v1/admin/events/${eventToDelete.id}`,
        method: "DELETE",
      });
      setEvents(events.filter((e) => e.id !== eventToDelete.id));
      setEventToDelete(null);
    } catch (err) {
      setDeleteError(extractError(err));
    } finally {
      setDeleting(false);
    }
  }

  async function openEventWithMultipleReferencesModal(
    event: EventConfiguration
  ) {
    setSelectedEventWithMultipleReferences(event);
    setLoadingEventReferences(true);
    try {
      const references = await apiFetch({
        path: `/regifair/v1/admin/events/${event.id}/references`,
      });
      setReferencingPosts(
        references as Array<{ title: string; permalink: string }>
      );
    } catch (err) {
      setLoadingEventReferencesError(extractError(err));
    } finally {
      setLoadingEventReferences(false);
    }
  }

  function closeEventWithMultipleReferencesModal() {
    setSelectedEventWithMultipleReferences(null);
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <h1 className="wp-heading-inline">
        {__("Your events", "regi-fair")} &nbsp;
      </h1>
      <Button onClick={openCreateEventModal} variant="primary">
        {__("Add event", "regi-fair")}
      </Button>

      {events.length === 0 && <p>{__("No events found", "regi-fair")}</p>}
      {events.length !== 0 && (
        <table className="widefat mt">
          <thead>
            <tr>
              <th>{__("Name", "regi-fair")}</th>
              <th>{__("Date", "regi-fair")}</th>
              <th>{__("Registrations", "regi-fair")}</th>
              <th>{__("Post", "regi-fair")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.map((e: EventConfiguration) => {
              return (
                <tr key={e.id}>
                  <td>
                    <Link to={`/event/${e.id}`}>{e.name}</Link>
                  </td>
                  <td>{e.date}</td>
                  <td>
                    {e.registrations === 0 && "-"}
                    {e.registrations > 0 && (
                      <Link to={`/event/${e.id}/registrations`}>
                        {e.registrations}
                      </Link>
                    )}
                  </td>
                  <td>
                    {!e.postPermalink && "-"}
                    {e.postPermalink && (
                      <Link to={e.postPermalink} target="_blank">
                        {e.postTitle}
                      </Link>
                    )}
                    {e.hasMultipleReferences && (
                      <Button
                        className="warning-sign"
                        variant="link"
                        onClick={() => openEventWithMultipleReferencesModal(e)}
                        aria-label={__("Warning", "regi-fair")}
                      >
                        <Icon icon="warning" />
                      </Button>
                    )}
                  </td>
                  <td>
                    <Button
                      variant="secondary"
                      isDestructive={true}
                      onClick={() => openDeleteEventModal(e)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <br />

      {error && (
        <Notice status="error" isDismissible={false}>
          {error}
        </Notice>
      )}

      {showCreateEventModal && (
        <Modal
          title={__("Create event", "regi-fair")}
          onRequestClose={closeCreateEventModal}
        >
          {!chooseTemplate && (
            <>
              <Button variant="primary" onClick={loadTemplates}>
                {__("From template", "regi-fair")}
              </Button>
              &nbsp;
              <Button variant="primary" onClick={newEventFromScratch}>
                {__("From scratch", "regi-fair")}
              </Button>
            </>
          )}
          {chooseTemplate && templatesLoading && <Loading />}
          {chooseTemplate && !templatesLoading && templatesError && (
            <Notice status="error" isDismissible={false}>
              {templatesError}
            </Notice>
          )}
          {chooseTemplate &&
            !templatesLoading &&
            !templatesError &&
            templates.length === 0 && (
              <>
                <p>{__("No templates found", "regi-fair")}</p>
                <Button variant="primary" onClick={openCreateTemplatePage}>
                  {__("Create your first template", "regi-fair")}
                </Button>
              </>
            )}
          {chooseTemplate &&
            !templatesLoading &&
            !templatesError &&
            templates.length > 0 && (
              <>
                <SelectControl
                  label={__("Select template", "regi-fair")}
                  options={templates}
                  onChange={setSelectedTemplateId}
                  className="mb"
                  __nextHasNoMarginBottom={true}
                  __next40pxDefaultSize={true}
                />
                <Button variant="primary" onClick={newEventFromTemplate}>
                  {__("Create", "regi-fair")}
                </Button>
              </>
            )}
        </Modal>
      )}

      {eventToDelete !== null && (
        <Modal
          title={__("Delete event", "regi-fair")}
          onRequestClose={closeDeleteEventModal}
        >
          <p>{__("Do you really want to delete this event?", "regi-fair")}</p>
          <p>
            <strong>
              {__(
                "WARNING: all the saved registrations will be deleted and users will not be notified about the deletion",
                "regi-fair"
              )}
            </strong>
          </p>
          {deleteError && (
            <Notice className="mb" status="error" isDismissible={false}>
              {deleteError}
            </Notice>
          )}
          {deleting && (
            <p>
              <Spinner />
              {__("Deleting...", "regi-fair")}
            </p>
          )}
          <Button
            variant="primary"
            onClick={confirmDeleteEvent}
            disabled={deleting}
            isBusy={deleting}
            isDestructive={true}
          >
            {__("Confirm", "regi-fair")}
          </Button>
          &nbsp;
          <Button variant="secondary" onClick={closeDeleteEventModal}>
            {__("Cancel", "regi-fair")}
          </Button>
        </Modal>
      )}

      {selectedEventWithMultipleReferences !== null && (
        <Modal
          title={__("Event form is referenced in multiple posts", "regi-fair")}
          onRequestClose={closeEventWithMultipleReferencesModal}
        >
          <p>
            {__(
              "This plugin expects that an event form is referenced only in one published post.",
              "regi-fair"
            )}
          </p>
          <p>
            <strong>
              {__(
                "Please, ensure that you have only one post referencing this event.",
                "regi-fair"
              )}
            </strong>
          </p>
          <p>
            {__(
              "The following posts are referencing the same event form:",
              "regi-fair"
            )}
          </p>
          <ul>
            {referencingPosts.map((p, i) => (
              <li key={`reference_${i}`}>
                <Link to={p.permalink} target="_blank">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
          {loadingEventReferencesError && (
            <Notice status="error" isDismissible={false}>
              {loadingEventReferencesError}
            </Notice>
          )}
          {loadingEventReferences && (
            <p>
              <Spinner />
              {__("Loading...", "regi-fair")}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
};

export default ListEvents;
