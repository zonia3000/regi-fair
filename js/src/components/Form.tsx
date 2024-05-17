import React, { useState, useEffect } from 'react';
import { FormProps } from './classes/components-props';
import apiFetch from '@wordpress/api-fetch';
import Loading from './Loading';
import TextField from './fields/TextField';
import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { extractError } from './utils';
import './style.css';
import RadioField from './fields/RadioField';

const Form = (props: FormProps) => {
    const [event, setEvent] = useState(null as EventConfiguration);
    const [found, setFound] = useState(false);
    const [fields, setFields] = useState([]);
    const [error, setError] = useState('');
    const [fieldsErrors, setFieldsErrors] = useState({});

    useEffect(() => {
        props.setLoading(true);
        apiFetch({ path: `/wpoe/v1/events/${props.eventId}` })
            .then((result) => {
                setFound(true);
                const eventConfig = result as EventConfiguration;
                setEvent(eventConfig);
                setFields(eventConfig.formFields.map(_ => ''));
            })
            .catch(err => {
                if (err.code === 'event_not_found') {
                    setFound(false);
                } else {
                    setError(extractError(err));
                }
            })
            .finally(() => {
                props.setLoading(false);
            });
    }, []);

    function setFieldValue(newValue: string, index: number) {
        setFields(fields.map((oldValue: string, i: number) => (index === i) ? newValue : oldValue));
    };

    async function submitForm() {
        setError('');
        setFieldsErrors({});
        try {
            await apiFetch({
                path: `/wpoe/v1/events/${props.eventId}`,
                method: 'POST',
                data: fields
            });
        } catch (err) {
            if (typeof err === 'object' && 'data' in err && 'fieldsErrors' in err.data) {
                setFieldsErrors(err.data.fieldsErrors);
            }
            setError(extractError(err));
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

            {error && <Notice status='error' className='mt mb-2'>{error}</Notice>}

            <Button variant='primary' className='mt' onClick={submitForm}>{__('Register to the event', 'wp-open-events')}</Button>
        </>
    )
};

export default Form;