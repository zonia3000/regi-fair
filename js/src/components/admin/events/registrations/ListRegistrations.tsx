import apiFetch from "@wordpress/api-fetch";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RegistrationsList } from "../../../classes/registration";
import { extractError } from "../../../utils";
import { __, sprintf } from "@wordpress/i18n";
import Loading from "../../../Loading";
import { Button, CheckboxControl, Modal, Notice } from "@wordpress/components";
import Pagination from "../../Pagination";

const ListRegistrations = (props: { waiting: boolean }) => {
  const { eventId } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [eventName, setEventName] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [head, setHead] = useState(
    [] as Array<{ label: string; deleted: boolean }>,
  );
  const [rows, setRows] = useState([] as string[][]);
  const [total, setTotal] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [hasDeletedFields, setHasDeletedFields] = useState(false);
  const [showDeletedFields, setShowDeletedFields] = useState(false);
  const [
    showConfirmDeleteRegistrationModal,
    setShowConfirmDeleteRegistrationModal,
  ] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState(
    null as string | null,
  );
  const [deletionError, setDeletionError] = useState("");

  useEffect(() => {
    loadPage();
  }, [page, pageSize, props.waiting]);

  async function loadPage() {
    setLoading(true);
    try {
      const result: RegistrationsList = await apiFetch({
        path: `/regifair/v1/admin/events/${eventId}/registrations?waitingList=${props.waiting}&page=${page}&pageSize=${pageSize}`,
      });
      setEventName(result.eventName);
      setHead(result.head);
      setHasDeletedFields(result.head.find((h) => h.deleted) !== undefined);
      setRows(result.body);
      setTotal(result.total);
      setTotalParticipants(result.totalParticipants);
      setTotalWaiting(result.totalWaiting);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  function back() {
    navigate("/");
  }

  function editRegistration(registrationId: string) {
    navigate(`/event/${eventId}/registrations/${registrationId}`);
  }

  function showConfirmedRegistrations() {
    navigate(`/event/${eventId}/registrations`);
  }

  function showWaitingList() {
    navigate(`/event/${eventId}/registrations/waiting`);
  }

  async function download() {
    setLoading(true);
    setDownloadError("");
    try {
      const response: Response = await apiFetch({
        path: `/regifair/v1/admin/events/${eventId}/registrations/download?waitingList=${props.waiting}`,
        parse: false,
      });
      const data = await response.text();
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "registrations.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  function openDeleteRegistrationModal(registrationId: string) {
    setDeletionError("");
    setRegistrationToDelete(registrationId);
    setShowConfirmDeleteRegistrationModal(true);
  }

  async function deleteRegistration() {
    setLoading(true);
    try {
      await apiFetch({
        path: `/regifair/v1/admin/events/${eventId}/registrations/${registrationToDelete}`,
        method: "DELETE",
      });
      setShowConfirmDeleteRegistrationModal(false);
      await loadPage();
    } catch (err) {
      setDeletionError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading />;
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

  return (
    <div>
      <h1 className="wp-heading-inline">
        {!props.waiting &&
          sprintf(
            /* translators: %s is replaced with the name of the event */
            __('Registrations for the event "%s"', "regi-fair"),
            eventName,
          )}
        {props.waiting &&
          sprintf(
            /* translators: %s is replaced with the name of the event */
            __('Waiting list for the event "%s"', "regi-fair"),
            eventName,
          )}
      </h1>
      <Button onClick={download} variant="primary">
        {__("Download CSV", "regi-fair")}
      </Button>
      {downloadError && (
        <div className="mt">
          <Notice status="error" isDismissible={false}>
            {downloadError}
          </Notice>
        </div>
      )}
      <p>
        <strong>{__("Confirmed participants", "regi-fair")}</strong>:
        &nbsp;
        {props.waiting ? (
          <Button variant="link" onClick={showConfirmedRegistrations}>
            {totalParticipants}
          </Button>
        ) : (
          totalParticipants
        )}
        {totalWaiting > 0 && (
          <span className="ml-2">
            <strong>{__("Waiting list", "regi-fair")}</strong>: &nbsp;
            {props.waiting ? (
              totalWaiting
            ) : (
              <Button variant="link" onClick={showWaitingList}>
                {totalWaiting}
              </Button>
            )}
          </span>
        )}
      </p>

      {hasDeletedFields && (
        <CheckboxControl
          label={__("Show deleted fields", "regi-fair")}
          checked={showDeletedFields}
          onChange={setShowDeletedFields}
          __nextHasNoMarginBottom={true}
        />
      )}

      <table className="widefat mt">
        <thead>
          <tr>
            <td>#</td>
            <td>{__("Date and time", "regi-fair")}</td>
            {head
              .filter((h) => showDeletedFields || !h.deleted)
              .map((h) => (
                <th key={h.label}>
                  {h.label}
                  {h.deleted && (
                    <span>&nbsp; ({__("deleted", "regi-fair")})</span>
                  )}
                </th>
              ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`row_${i}`}>
              {r
                .filter(
                  (_: string, j: number) =>
                    j < 2 || showDeletedFields || !head[j - 2].deleted,
                )
                .map((c: string, j: number) => (
                  <td key={`cell_${i}_${j}`}>{c.toString()}</td>
                ))}
              <td>
                <Button
                  onClick={() => editRegistration(r[0])}
                  variant="primary"
                >
                  {__("Edit", "regi-fair")}
                </Button>
                <Button
                  onClick={() => openDeleteRegistrationModal(r[0])}
                  variant="secondary"
                  className="ml"
                >
                  {__("Delete", "regi-fair")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        total={total}
      />

      <Button onClick={back} variant="secondary" className="mt">
        {__("Back", "regi-fair")}
      </Button>

      {showConfirmDeleteRegistrationModal && (
        <Modal
          title={__("Confirm registration deletion", "regi-fair")}
          onRequestClose={() => setShowConfirmDeleteRegistrationModal(false)}
        >
          <p>
            {sprintf(
              /* translators: %d is replaced with the id of the registration */
              __(
                "Do you really want to delete the registration #%d?",
                "regi-fair",
              ),
              registrationToDelete,
            )}
          </p>
          {deletionError && (
            <Notice status="error" className="mt-2 mb-2" isDismissible={false}>
              {deletionError}
            </Notice>
          )}
          <Button variant="primary" onClick={deleteRegistration}>
            {__("Confirm", "regi-fair")}
          </Button>
        </Modal>
      )}
    </div>
  );
};

export default ListRegistrations;
