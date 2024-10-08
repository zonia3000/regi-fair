import apiFetch from "@wordpress/api-fetch";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RegistrationsList } from "../../../classes/registration";
import { extractError } from "../../../utils";
import { __, _x, sprintf } from "@wordpress/i18n";
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
  const [head, setHead] = useState([]);
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
  const [registrationToDelete, setRegistrationToDelete] = useState(null);
  const [deletionError, setDeletionError] = useState("");

  useEffect(() => {
    loadPage();
  }, [page, pageSize, props.waiting]);

  async function loadPage() {
    setLoading(true);
    try {
      const result: RegistrationsList = await apiFetch({
        path: `/wpoe/v1/admin/events/${eventId}/registrations?waitingList=${props.waiting}&page=${page}&pageSize=${pageSize}`,
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
        path: `/wpoe/v1/admin/events/${eventId}/registrations/download?waitingList=${props.waiting}`,
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
        path: `/wpoe/v1/admin/events/${eventId}/registrations/${registrationToDelete}`,
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
            _x(
              'Registrations for the event "%s"',
              "Name of the event",
              "wp-open-events",
            ),
            eventName,
          )}
        {props.waiting &&
          sprintf(
            _x(
              'Waiting list for the event "%s"',
              "Name of the event",
              "wp-open-events",
            ),
            eventName,
          )}
      </h1>
      <Button onClick={download} variant="primary">
        {__("Download CSV", "wp-open-events")}
      </Button>
      {downloadError && (
        <div className="mt">
          <Notice status="error" isDismissible={false}>
            {downloadError}
          </Notice>
        </div>
      )}
      <p>
        <strong>{__("Confirmed participants", "wp-open-events")}</strong>:
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
            <strong>{__("Waiting list", "wp-open-events")}</strong>: &nbsp;
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
          label={__("Show deleted fields", "wp-open-events")}
          checked={showDeletedFields}
          onChange={setShowDeletedFields}
          __nextHasNoMarginBottom={true}
        />
      )}

      <table className="widefat mt">
        <thead>
          <tr>
            <td>#</td>
            <td>{__("Date and time", "wp-open-events")}</td>
            {head
              .filter((h) => showDeletedFields || !h.deleted)
              .map((h) => (
                <th key={h.label}>
                  {h.label}
                  {h.deleted && (
                    <span>&nbsp; ({__("deleted", "wp-open-events")})</span>
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
                  <td key={`cell_${i}_${j}`}>{c}</td>
                ))}
              <td>
                <Button
                  onClick={() => editRegistration(r[0])}
                  variant="primary"
                >
                  {__("Edit", "wp-open-events")}
                </Button>
                <Button
                  onClick={() => openDeleteRegistrationModal(r[0])}
                  variant="secondary"
                  className="ml"
                >
                  {__("Delete", "wp-open-events")}
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
        {__("Back", "wp-open-events")}
      </Button>

      {showConfirmDeleteRegistrationModal && (
        <Modal
          title={__("Confirm registration deletion", "wp-open-events")}
          onRequestClose={() => setShowConfirmDeleteRegistrationModal(false)}
        >
          <p>
            {sprintf(
              _x(
                "Do you really want to delete the registration #%d?",
                "id of the registration",
                "wp-open-events",
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
            {__("Confirm", "wp-open-events")}
          </Button>
        </Modal>
      )}
    </div>
  );
};

export default ListRegistrations;
