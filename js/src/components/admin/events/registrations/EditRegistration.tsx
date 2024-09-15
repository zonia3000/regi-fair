import apiFetch from "@wordpress/api-fetch";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { extractError } from "../../../utils";
import { __, _x, sprintf } from "@wordpress/i18n";
import Loading from "../../../Loading";
import { Button, CheckboxControl, Notice } from "@wordpress/components";
import FormFields from "../../../FormFields";
import { EventConfiguration } from "../../../classes/event";

const EditRegistration = () => {
  const { eventId, registrationId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [event, setEvent] = useState(null as EventConfiguration);
  const [fields, setFields] = useState([] as string[]);
  const [availableSeats, setAvailableSeats] = useState(null);
  const [fieldsErrors, setFieldsErrors] = useState({});
  const [error, setError] = useState('');
  const [showEmailCheckbox, setShowEmailCheckbox] = useState(false);
  const [notifyUserByEmail, setNotifyUserByEmail] = useState(false);

  useEffect(() => {
    loadEventData();
  }, []);

  async function loadEventData() {
    let eventConfig: EventConfiguration | null = null;
    try {
      eventConfig = await apiFetch({ path: `/wpoe/v1/admin/events/${eventId}` });
      setFound(true);
      setEvent(eventConfig);
      if (!isNaN(eventConfig.availableSeats)) {
        setAvailableSeats(eventConfig.availableSeats);
      }
    } catch (err) {
      if (err.code === 'event_not_found') {
        setFound(false);
      } else {
        setError(extractError(err));
      }
      setLoading(false);
      return;
    }
    try {
      const { values }: { values: string[] } = await apiFetch({ path: `/wpoe/v1/admin/events/${eventId}/registrations/${registrationId}` });
      setFields(values);
      const hasConfirmationAddressFields =
        eventConfig.formFields.filter(
          f => f.fieldType === 'email'
            && f.extra && 'confirmationAddress' in f.extra && f.extra.confirmationAddress === true
        ).length > 0;
      if (hasConfirmationAddressFields) {
        setShowEmailCheckbox(true);
        setNotifyUserByEmail(true);
      }
    } catch (err) {
      if (err.code === 'registration_not_found') {
        setFound(false);
      } else {
        setError(extractError(err));
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateRegistration() {
    setLoading(true);
    try {
      await apiFetch({
        path: `/wpoe/v1/admin/events/${eventId}/registrations/${registrationId}&sendEmail=${notifyUserByEmail}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields)
      });
      back();
    } catch (err) {
      if (err.code === 'invalid_form_fields') {
        setFieldsErrors(err.data.fieldsErrors);
      }
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  function back() {
    navigate(`/event/${eventId}/registrations`);
  }

  if (loading) {
    return <Loading />
  }

  if (!found) {
    return <p>{__('Registration not found', 'wp-open-events')}</p>
  }

  return (
    <div>
      <h1 className='wp-heading-inline'>
        {sprintf(_x('Edit registration #%d', 'Id of the registration', 'wp-open-events'), registrationId)}
      </h1>

      {availableSeats !== null &&
        <Notice status='info' isDismissible={false} className="mt-2">
          {sprintf(_x('There are still %d seats available', 'number of available seats', 'wp-open-events'), availableSeats)}
        </Notice>
      }

      <FormFields
        formFields={event.formFields}
        fieldsValues={fields}
        setFieldsValues={setFields}
        disabled={false}
        fieldsErrors={fieldsErrors} />

      {
        showEmailCheckbox &&
        <CheckboxControl
          label={__('Notify user by e-mail', 'wp-open-events')}
          checked={notifyUserByEmail}
          onChange={setNotifyUserByEmail}
          className='mt-2'
        />
      }

      {error && <div className='mt-2 mb'><Notice status='error' isDismissible={false}>{error}</Notice></div>}

      <Button variant='primary' className='mt-2' onClick={updateRegistration}>
        {__('Update', 'wp-open-events')}
      </Button>
      &nbsp;
      <Button onClick={back} className='mt-2' variant='secondary'>
        {__('Back', 'wp-open-events')}
      </Button>
    </div>
  );
}

export default EditRegistration;
