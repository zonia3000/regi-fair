import React, { useEffect, useState } from 'react';
import { TextControl, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const EditTextField = (props: any) => {

    const [fieldLabel, setFieldLabel] = useState('');
    const [fieldDescription, setFieldDescription] = useState('');
    const [fieldRequired, setFieldRequired] = useState(false);

    useEffect(() => {
        props.setField({
            label: '',
            fieldType: props.fieldType,
            required: false,
            description: ''
        });
    }, []);


    const saveFieldLabel = (value: string) => {
        setFieldLabel(value);
        props.setField({
            ...props.field,
            label: value
        });
    }

    const saveFieldDescription = (value: string) => {
        setFieldDescription(value);
        props.setField({
            ...props.field,
            description: value
        });
    }

    const saveFieldRequired = (value: boolean) => {
        setFieldRequired(value);
        props.setField({
            ...props.field,
            required: value
        });
    }

    return (
        <>
            <TextControl
                label={__('Label', 'wp-open-events')}
                onChange={saveFieldLabel}
                value={fieldLabel}
                required
            />
            <TextControl
                label={__('Description', 'wp-open-events')}
                onChange={saveFieldDescription}
                value={fieldDescription}
                required
            />
            <CheckboxControl
                label={__('Required', 'wp-open-events')}
                checked={fieldRequired}
                onChange={saveFieldRequired}
            />
        </>
    );
};

export default EditTextField;