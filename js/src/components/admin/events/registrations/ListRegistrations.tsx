import apiFetch from "@wordpress/api-fetch";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RegistrationsList } from "../../../classes/registration";
import { extractError } from "../../../utils";
import { __, _x, sprintf } from "@wordpress/i18n";
import Loading from "../../../Loading";
import { Notice } from "@wordpress/components";
import Pagination from "../../Pagination";

const ListRegistrations = () => {
  const { eventId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventName, setEventName] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [head, setHead] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

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
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      {error && <div className='mb'><Notice status='error'>{error}</Notice></div>}
      {!error &&
        <div>
          <h1 className='wp-heading-inline'>
            {sprintf(_x('Registrations for the event "%s"', 'Name of the event', 'wp-open-events'), eventName)}
          </h1>
          <table className='widefat mt'>
            <thead>
              <tr>
                <td>{__('Date and time', 'wp-open-events')}</td>
                {head.map(h =>
                  <th key={h.label}>
                    {h.label}{h.deleted && <span>&nbsp; ({__('deleted', 'wp-open-events')})</span>}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) =>
                <tr key={`row_${i}`}>
                  {r.map((c: string, j: number) =>
                    <td key={`cell_${i}_${j}`}>{c}</td>
                  )}
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
        </div>
      }
    </div>
  );
};

export default ListRegistrations;