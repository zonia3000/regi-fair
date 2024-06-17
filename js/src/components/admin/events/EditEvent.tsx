import React, { useState, useEffect } from 'react';
import { Button, TextControl, CheckboxControl, BaseControl, Notice, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Loading from '../../Loading';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import EditFormFields from '../fields/EditFormFields';
import { cleanupFields, extractError } from '../../utils';
import { Settings } from '../../classes/settings';

const EditEvent = () => {

    const { eventId } = useParams();
    let [searchParams,] = useSearchParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [found, setFound] = useState(false);
    const [eventName, setEventName] = useState('');
    const [date, setDate] = useState('');
    const [autoremove, setAutoremove] = useState(true);
    const [formFields, setFormFields] = useState([]);
    const [hasResponses, setHasResponses] = useState(false);
    const [hasMaxParticipants, setHasMaxParticipants] = useState(false);
    const [maxParticipants, setMaxParticipants] = useState('');
    const [notifyAdmin, setNotifyAdmin] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
    const [editableRegistrations, setEditableRegistrations] = useState(true);
    const [customizeEmailContent, setCustomizeEmailContent] = useState(false);
    const [emailExtraContent, setEmailExtraContent] = useState('');
    const [error, setError] = useState('');
    const [valid, setValid] = useState(true);

    useEffect(() => {
        if (eventId === 'new') {
            setLoading(true);
            setFound(true);
            const templateId = searchParams.get('template');
            if (templateId) {
                apiFetch({ path: `/wpoe/v1/admin/templates/${templateId}` })
                    .then((result) => {
                        const template = result as TemplateConfiguration;
                        setAutoremove(template.autoremove);
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
                    .catch(err => {
                        setError(extractError(err));
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                // New event from scratch, load global settings
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
                    })
                    .catch(err => {
                        setError(extractError(err));
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }
        } else {
            setLoading(true);
            apiFetch({ path: `/wpoe/v1/admin/events/${eventId}` })
                .then((result) => {
                    setFound(true);
                    const event = result as EventConfiguration;
                    setEventName(event.name);
                    setDate(event.date);
                    setAutoremove(event.autoremove);
                    setFormFields(event.formFields);
                    setHasResponses(event.hasResponses || false);
                    if (event.maxParticipants) {
                        setHasMaxParticipants(true);
                        setMaxParticipants(event.maxParticipants.toString());
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
                .catch(err => {
                    if (err.code === 'event_not_found') {
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
            id: eventId === 'new' ? null : Number(eventId),
            name: eventName,
            date: parseDate(),
            adminEmail: notifyAdmin ? adminEmail.trim() : null,
            editableRegistrations,
            formFields,
            autoremove: autoremove,
            autoremovePeriod: 30,
            maxParticipants: hasMaxParticipants ? Number(maxParticipants) : null,
            waitingList: false,
            extraEmailContent: customizeEmailContent ? emailExtraContent.trim() : null
        };
        setLoading(true);
        try {
            if (eventId === 'new') {
                await apiFetch({
                    path: '/wpoe/v1/admin/events',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...event,
                        formFields: cleanupFields(event.formFields)
                    }),
                });
            } else {
                await apiFetch({
                    path: `/wpoe/v1/admin/events/${eventId}`,
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...event,
                        formFields: cleanupFields(event.formFields)
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
        navigate('/');
    }

    if (loading) {
        return <Loading />;
    }

    if (!found) {
        return <p>{__('Event not found', 'wp-open-events')}</p>
    }

    return (
        <div>
            <h1>{eventId === 'new' ? __('Create event', 'wp-open-events') : __('Edit event', 'wp-open-events')}</h1>
            <div className={!valid && !eventName.trim() ? 'form-error' : ''}>
                <TextControl
                    label={__('Name', 'wp-open-events')}
                    onChange={setEventName}
                    value={eventName}
                    required
                />
                {!valid && !eventName.trim() &&
                    <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
                }
            </div>
            <div className={!valid && !date ? 'form-error' : ''}>
                <BaseControl label={__('Date', 'wp-open-events')} __nextHasNoMarginBottom={false} id='eventDate'>
                    <input type='date' id='eventDate' className='components-text-control__input' required
                        value={date} onChange={e => setDate(e.target.value)} />
                </BaseControl>
                {!valid && !date &&
                    <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
                }
            </div>

            {hasResponses && <div className='mt-2 mb'>
                <Notice status='warning' isDismissible={false}>
                    <strong>{__('Warning')}</strong>: &nbsp;
                    {__('this event has already some registrations. Adding or removing fields can result in having some empty values in your registrations table.', 'wp-open-events')}
                </Notice>
            </div>}

            <EditFormFields formFields={formFields} setFormFields={setFormFields} />

            <br /><br />
            <CheckboxControl
                label={__('Set a maximum number of participants', 'wp-open-events')}
                checked={hasMaxParticipants}
                onChange={setHasMaxParticipants}
            />
            {hasMaxParticipants &&
                <div className={!valid && !maxParticipants ? 'form-error' : ''}>
                    <TextControl
                        label={__('Total available seats', 'wp-open-events')}
                        onChange={setMaxParticipants}
                        value={maxParticipants}
                        type='number'
                        required
                    />
                    {!valid && !maxParticipants &&
                        <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
                    }
                </div>
            }

            <CheckboxControl
                label={__('Autoremove user data after the event', 'wp-open-events')}
                checked={autoremove}
                onChange={setAutoremove}
            />

            <CheckboxControl
                label={__('Allow the users to edit or delete their registrations', 'wp-open-events')}
                checked={editableRegistrations}
                onChange={setEditableRegistrations}
            />
            <CheckboxControl
                label={__('Notify an administrator by e-mail when a new registration is created', 'wp-open-events')}
                checked={notifyAdmin}
                onChange={setNotifyAdmin}
            />
            {notifyAdmin &&
                <div className={!valid && !adminEmail ? 'form-error' : ''}>
                    <TextControl
                        label={__('Administrator e-mail address', 'wp-open-events')}
                        onChange={setAdminEmail}
                        value={adminEmail}
                        required
                    />
                    {!valid && !adminEmail &&
                        <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
                    }
                </div>
            }
            <CheckboxControl
                label={__('Add custom message to confirmation e-mail', 'wp-open-events')}
                checked={customizeEmailContent}
                onChange={setCustomizeEmailContent}
            />
            {customizeEmailContent &&
                <TextareaControl
                    label={__('Custom confirmation e-mail content', 'wp-open-events')}
                    onChange={setEmailExtraContent}
                    value={emailExtraContent}
                    help={__('This content will be added at the end of the confirmation e-mail messages. Allowed HTML tags: <b>, <i>, <a>, <hr>, <p>, <br>', 'wp-open-events')}
                />
            }

            <br /><hr />

            {error &&
                <div className='mb'>
                    <Notice status='error' isDismissible={false}>{error}</Notice>
                </div>}

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