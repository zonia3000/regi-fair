import React, { useState, useEffect } from 'react';
import { FormProps } from './classes/components-props';
import apiFetch from '@wordpress/api-fetch';
import Loading from './Loading';
import TextField from './fields/TextField';
import { Button, Modal, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { extractError } from './utils';
import './style.css';
import RadioField from './fields/RadioField';

const Form = (props: FormProps) => {
    const [event, setEvent] = useState(null as EventConfiguration);
    const [found, setFound] = useState(false);
    const [fields, setFields] = useState([]);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [fieldsErrors, setFieldsErrors] = useState({});
    const [registrationToken, setRegistrationToken] = useState('');
    const [editingExisting, setEditingExisting] = useState(false);
    const [showConfirmDeleteRegistrationModal, setShowConfirmDeleteRegistrationModal] = useState(false);
    const [deletionError, setDeletionError] = useState('');
    const [deleted, setDeleted] = useState(false);

    useEffect(() => {
        props.setLoading(true);
        loadEventData()
            .finally(() => {
                props.setLoading(false);
            });
        window.addEventListener('hashchange', loadEventData);
        return () => {
            window.removeEventListener('hashchange', loadEventData);
        };
    }, []);

    function setFieldValue(newValue: string, index: number) {
        setFields(fields.map((oldValue: string, i: number) => (index === i) ? newValue : oldValue));
    };

    async function loadEventData() {
        let eventConfig: EventConfiguration | null = null;
        try {
            eventConfig = await apiFetch({ path: `/wpoe/v1/events/${props.eventId}` });
            setFound(true);
            setEvent(eventConfig);
            setFields(eventConfig.formFields.map(_ => ''));
        } catch (err) {
            if (err.code === 'event_not_found') {
                setFound(false);
            } else {
                setError(extractError(err));
            }
        }
        if (eventConfig === null || !eventConfig.editableRegistrations) {
            return;
        }
        await loadExistingRegistration();
    }

    async function loadExistingRegistration() {
        const hash = window.location.hash;
        const match = hash.match(/registration=(.*)/);
        if (!match || match.length !== 2) {
            return;
        }
        const token = match[1];
        try {
            const registration: string[] = await apiFetch({ path: `/wpoe/v1/events/${props.eventId}/${token}` });
            setRegistrationToken(token);
            setFields(registration);
            setEditingExisting(true);
        } catch (err) {
            console.warn('Unable to retrieve registration');
        }
    }

    async function submitForm() {
        setError('');
        setDeletionError('')
        setFieldsErrors({});
        setSubmitted(false);
        setDeleted(false);
        try {
            if (editingExisting) {
                await apiFetch({
                    path: `/wpoe/v1/events/${props.eventId}/${registrationToken}`,
                    method: 'PUT',
                    data: fields
                });
            } else {
                await apiFetch({
                    path: `/wpoe/v1/events/${props.eventId}`,
                    method: 'POST',
                    data: fields
                });
                // reset field values
                setFields(fields.map(_ => ''));
            }
            setSubmitted(true);
        } catch (err) {
            if (typeof err === 'object' && 'data' in err && 'fieldsErrors' in err.data) {
                setFieldsErrors(err.data.fieldsErrors);
            }
            setError(extractError(err));
        }
    }

    async function deleteRegistration() {
        setError('');
        setDeletionError('')
        setFieldsErrors({});
        setDeleted(false);
        setSubmitted(false);
        try {
            await apiFetch({
                path: `/wpoe/v1/events/${props.eventId}/${registrationToken}`,
                method: 'DELETE'
            });
            // reset registration token on URL
            window.location.hash = '';
            // reset field values
            setFields(fields.map(_ => ''));
            setDeleted(true);
            setShowConfirmDeleteRegistrationModal(false);
            setEditingExisting(false);
        } catch (err) {
            setDeletionError(extractError(err));
        }
    }

    if (props.loading) {
        return <Loading />
    }

    if (!found) {
        if (props.admin) {
            return <p>{__('Event not found', 'wp-open-events')}</p>
        } else {
            // Show nothing in public posts
            return;
        }
    }

    return (
        <>
            {editingExisting && <Notice status='info' className='mb-2'>{__('Welcome back. You are editing an existing registration', 'wp-open-events')}</Notice>}

            {event.formFields.map((field: Field, index: number) => {
                return (<div key={`field-${index}`} className={index.toString() in fieldsErrors ? 'form-error mt' : 'mt'}>
                    {
                        (field.fieldType === 'text' || field.fieldType === 'email')
                        && <TextField
                            required={field.required}
                            label={field.label} disabled={props.disabled} type={field.fieldType}
                            value={fields[index]} setValue={(v: string) => setFieldValue(v, index)} />
                    }
                    {
                        field.fieldType === 'radio'
                        && <RadioField
                            required={field.required}
                            label={field.label} disabled={props.disabled} options={(field.extra as any).options}
                            value={fields[index]} setValue={(v: string) => setFieldValue(v, index)} />
                    }
                    {index.toString() in fieldsErrors &&
                        <span className='error-text'>{(fieldsErrors as any)[index.toString()]}</span>}
                </div>);
            })}

            {error && <Notice status='error' className='mt-2 mb-2'>{error}</Notice>}

            {submitted && <Notice status='success' className='mt-2 mb-2'>
                {editingExisting ? __('Your registration has been updated', 'wp-open-events')
                    : __('Your registration has been submitted', 'wp-open-events')}
            </Notice>}

            {deleted
                && <Notice status='success' className='mt-2 mb-2'>
                    {__('Your registration has been deleted', 'wp-open-events')}
                </Notice>
            }

            <Button variant='primary' className='mt' onClick={submitForm} disabled={props.disabled}>
                {editingExisting ? __('Update the registration', 'wp-open-events') : __('Register to the event', 'wp-open-events')}
            </Button>

            {editingExisting &&
                <Button variant='secondary' className='ml mt' onClick={() => setShowConfirmDeleteRegistrationModal(true)} disabled={props.disabled}>
                    {__('Delete the registration', 'wp-open-events')}
                </Button>
            }

            {showConfirmDeleteRegistrationModal &&
                <Modal title={__('Confirm registration deletion', 'wp-open-events')} onRequestClose={() => setShowConfirmDeleteRegistrationModal(false)}>
                    <p>{__('Do you really want to delete the registration to this event?', 'wp-open-events')}</p>
                    {deletionError && <Notice status='error' className='mt-2 mb-2'>{deletionError}</Notice>}
                    <Button variant='primary' onClick={deleteRegistration}>
                        {__('Confirm', 'wp-open-events')}
                    </Button>
                </Modal>}
        </>
    )
};

export default Form;