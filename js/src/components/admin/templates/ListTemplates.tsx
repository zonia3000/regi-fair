import React, { useEffect, useState } from "react";
import { sprintf, __, _x } from "@wordpress/i18n";
import { Link, useNavigate } from "react-router-dom";
import apiFetch from "@wordpress/api-fetch";
import Loading from "../../Loading";
import { Button, Modal, Notice, Spinner } from "@wordpress/components";
import { extractError } from "../../utils";
import "../../style.css";
import { TemplateConfiguration } from "../../classes/template";

const ListTemplates = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([] as TemplateConfiguration[]);
  const [templateToDelete, setTemplateToDelete] = useState(
    null as TemplateConfiguration | null,
  );
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch({ path: "/wpoe/v1/admin/templates" })
      .then((result) => {
        setTemplates(result as TemplateConfiguration[]);
      })
      .catch((err) => {
        setError(extractError(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function newTemplate() {
    navigate("/template/new");
  }

  function openDeleteTemplateModal(template: TemplateConfiguration) {
    setTemplateToDelete(template);
  }

  function closeDeleteTemplateModal() {
    setTemplateToDelete(null);
  }

  async function confirmDeleteTemplate() {
    setDeleting(true);
    try {
      await apiFetch({
        path: `/wpoe/v1/admin/templates/${templateToDelete.id}`,
        method: "DELETE",
      });
      setTemplates(templates.filter((t) => t.id !== templateToDelete.id));
      setTemplateToDelete(null);
    } catch (err) {
      setDeleteError(extractError(err));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <h1 className="wp-heading-inline">
        {__("Event templates", "wp-open-events")} &nbsp;
      </h1>
      <Button onClick={newTemplate} variant="primary">
        {__("Add event template", "wp-open-events")}
      </Button>

      {templates.length === 0 && (
        <p>{__("No event templates found", "wp-open-events")}</p>
      )}
      {templates.length !== 0 && (
        <table className="widefat mt">
          <thead>
            <tr>
              <th>{__("Name", "wp-open-events")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t: TemplateConfiguration) => {
              return (
                <tr key={t.id}>
                  <td>
                    <Link to={`/template/${t.id}`}>{t.name}</Link>
                  </td>
                  <td>
                    <Button
                      variant="primary"
                      onClick={() => openDeleteTemplateModal(t)}
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

      {templateToDelete !== null && (
        <Modal
          title={__("Delete template", "wp-open-events")}
          onRequestClose={closeDeleteTemplateModal}
        >
          <p>
            {sprintf(
              _x(
                "Do you really want to delete the template %s?",
                "Name of the template",
                "wp-open-events",
              ),
              templateToDelete.name,
            )}
          </p>
          {deleteError && (
            <Notice status="error" isDismissible={false}>
              {deleteError}
            </Notice>
          )}
          {deleting && (
            <p>
              <Spinner />
              {__("Deleting...", "wp-open-events")}
            </p>
          )}
          <Button
            variant="primary"
            onClick={confirmDeleteTemplate}
            disabled={deleting}
          >
            {__("Confirm", "wp-open-events")}
          </Button>
          &nbsp;
          <Button variant="secondary" onClick={closeDeleteTemplateModal}>
            {__("Cancel", "wp-open-events")}
          </Button>
        </Modal>
      )}
    </div>
  );
};

export default ListTemplates;
