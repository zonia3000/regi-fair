import React, { useState, useEffect } from 'react';
import { Button, TextControl, CheckboxControl, BaseControl, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Loading from '../../Loading';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import EditFormFields from '../fields/EditFormFields';
import { extractError } from '../../utils';

const EditEvent = () => {

    const { eventId } = useParams();
    let [searchParams,] = useSearchParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [eventData, setEventData] = useState(null);
    const [eventName, setEventName] = useState('');
    const [date, setDate] = useState((new Date()).toString());
    const [autoremove, setAutoremove] = useState(true);
    const [formFields, setFormFields] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (eventId === 'new') {
            const templateId = searchParams.get('template');
            if (templateId) {
                apiFetch({ path: `/wpoe/v1/admin/templates/${templateId}` })
                    .then((result) => {
                        const template = result as TemplateConfiguration;
                        setAutoremove(template.autoremove);
                        setFormFields(template.formFields);
                    })
                    .catch(err => {
                        setError(extractError(err));
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                setLoading(false);
            }
        } else {
            setLoading(true);
            apiFetch({ path: `/wpoe/v1/admin/events/${eventId}` })
                .then((result) => {
                    const event = result as EventConfiguration;
                    setEventData(event);
                    setEventName(event.name);
                    setDate(event.date);
                    setAutoremove(event.autoremove);
                    setFormFields(event.formFields);
                })
                .catch(err => {
                    setError(extractError(err));
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, []);

    async function save() {
        const event: EventConfiguration = {
            id: null,
            name: eventName,
            date: parseDate(),
            formFields,
            autoremove: autoremove,
            autoremovePeriod: 30,
            maxParticipants: null,
            waitingList: false
        };
        setLoading(true);
        try {
            await apiFetch({
                path: '/wpoe/v1/admin/events',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });
            back();
        } catch (err) {
            setError(extractError(err));
        } finally {
            setLoading(false);
        }
    };

    function parseDate() {
        return new Date(date).toISOString().slice(0, 10);
    }

    function back() {
        navigate('/');
    }

    if (loading) {
        return <Loading />;
    }

    return (
        <div>
            <h1>{eventId === 'new' ? __('Create event', 'wp-open-events') : __('Edit event', 'wp-open-events')}</h1>
            <TextControl
                label={__('Name', 'wp-open-events')}
                onChange={setEventName}
                value={eventName}
                required
            />
            <BaseControl label={__('Date', 'wp-open-events')} __nextHasNoMarginBottom={false} id='eventDate'>
                <input type='date' id='eventDate' className='components-text-control__input' required
                    value={date} onChange={e => setDate(e.target.value)} />
            </BaseControl>

            <EditFormFields formFields={formFields} setFormFields={setFormFields} />

            <br /><br />
            <CheckboxControl
                label={__('Autoremove user data after the event', 'wp-open-events')}
                checked={autoremove}
                onChange={setAutoremove}
            />

            <br /><hr />

            {error && <Notice status='error'>{error}</Notice>}

            <Button onClick={save} variant='primary'>
                {__('Save', 'wp-open-events')}
            </Button>
            &nbsp;
            <Button onClick={back} variant='secondary'>
                {__('Back', 'wp-open-events')}
            </Button>
        </div>
    );
}

export default EditEvent;