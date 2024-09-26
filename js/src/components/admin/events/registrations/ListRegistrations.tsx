import apiFetch from "@wordpress/api-fetch";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RegistrationsList } from "../../../classes/registration";
import { extractError } from "../../../utils";
import { __, _x, sprintf } from "@wordpress/i18n";
import Loading from "../../../Loading";
import { Button, Notice } from "@wordpress/components";
import Pagination from "../../Pagination";

const ListRegistrations = () => {
  const { eventId } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [eventName, setEventName] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [head, setHead] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    loadPage();
  }, [page, pageSize]);

  async function loadPage() {
    setLoading(true);
    try {
      const result: RegistrationsList
        = await apiFetch({ path: `/wpoe/v1/admin/events/${eventId}/registrations?page=${page}&pageSize=${pageSize}` });
      setEventName(result.eventName);
      setHead(result.head);
      setRows(result.body);
      setTotal(result.total);
      setTotalParticipants(result.totalParticipants);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  function back() {
    navigate('/');
  }

  function editRegistration(registrationId: string) {
    navigate(`/event/${eventId}/registrations/${registrationId}`);
  }

  async function download() {
    setLoading(true);
    setDownloadError('');
    try {
      const response: Response = await apiFetch({
        path: `/wpoe/v1/admin/events/${eventId}/registrations/download`,
        parse: false
      });
      const data = await response.text();
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registrations.csv';
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

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      {error && <div className='mb'><Notice status='error' isDismissible={false}>{error}</Notice></div>}
      {!error &&
        <div>
          <h1 className='wp-heading-inline'>
            {sprintf(_x('Registrations for the event "%s"', 'Name of the event', 'wp-open-events'), eventName)}
          </h1>
          <Button onClick={download} variant='primary'>
            {__('Download CSV', 'wp-open-events')}
          </Button>
          {downloadError &&
            <div className='mt'>
              <Notice status='error' isDismissible={false}>{downloadError}</Notice>
            </div>
          }
          <p>
            <strong>{__('Total participants', 'wp-open-events')}</strong>: {totalParticipants}
          </p>
          <table className='widefat mt'>
            <thead>
              <tr>
                <td>#</td>
                <td>{__('Date and time', 'wp-open-events')}</td>
                {head.map(h =>
                  <th key={h.label}>
                    {h.label}{h.deleted && <span>&nbsp; ({__('deleted', 'wp-open-events')})</span>}
                  </th>
                )}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) =>
                <tr key={`row_${i}`}>
                  {r.map((c: string, j: number) => (
                    <td key={`cell_${i}_${j}`}>{c}</td>
                  ))}
                  <td>
                    <Button onClick={() => editRegistration(r[0])} variant='primary'>
                      {__('Edit', 'wp-open-events')}
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            total={total}
          />

          <Button onClick={back} variant='secondary' className='mt'>
            {__('Back', 'wp-open-events')}
          </Button>
        </div>
      }
    </div>
  );
};

export default ListRegistrations;
