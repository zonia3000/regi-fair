import React, { useState, useEffect } from 'react';
import { FormProps } from './classes/components-props';
import apiFetch from '@wordpress/api-fetch';
import Loading from './Loading';
import TextField from './fields/TextField';

const Form = (props: FormProps) => {
    const [event, setEvent] = useState(null as EventConfiguration);
    const [fields, setFields] = useState([]);

    useEffect(() => {
        props.setLoading(true);
        apiFetch({ path: '/wpoe/v1/events/' + props.eventId }).then((result) => {
            setEvent(result as EventConfiguration);
            props.setLoading(false);
        });
    }, []);

    const setFieldValue = (newValue: string, index: number) => {
        setFields(fields.map((oldValue: string, i: number) => (index === i) ? newValue : oldValue));
    };

    if (props.loading) {
        return <Loading />;
    }

    return (
        <>
            {event.formFields.map((field: Field, index: number) => {
                switch (field.fieldType) {
                    case 'text':
                    case 'email':
                        return <TextField
                            label={field.label} disabled={props.disabled} type={field.fieldType}
                            value={fields[index]} setValue={(v: string) => setFieldValue(v, index)} />
                }
            })}
        </>
    )
};

export default Form;