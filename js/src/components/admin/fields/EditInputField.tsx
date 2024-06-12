import React, { useEffect, useRef, useState } from 'react';
import { TextControl, CheckboxControl, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { EditInputFieldProps } from '../../classes/components-props';
import '../../style.css';

const EditInputField = (props: EditInputFieldProps) => {

    const [initializing, setInitializing] = useState(true);
    const [fieldLabel, setFieldLabel] = useState('');
    const fieldLabelRef = useRef(fieldLabel);
    const [fieldDescription, setFieldDescription] = useState('');
    const [fieldRequired, setFieldRequired] = useState(false);
    const [useAsConfirmationAddress, setUseAsConfirmationAddress] = useState(false);
    const [useAsNumberOfPeople, setUseAsNumberOfPeople] = useState(false);
    const [min, setMin] = useState('');
    const [max, setMax] = useState('');
    const [validated, setValidated] = useState(false);

    useEffect(() => {
        if (props.field === null) {
            const field: Field = {
                label: '',
                fieldType: props.fieldType,
                required: false,
                description: '',
                validate
            };
            if (props.fieldType === 'email') {
                setUseAsConfirmationAddress(true);
                field.extra = {
                    confirmationAddress: true
                }
            }
            if (props.fieldType === 'number' && props.useAsNumberOfPeople) {
                setUseAsNumberOfPeople(true);
                field.extra = {
                    useAsNumberOfPeople: true
                }
            }
            props.setField(field);
        } else {
            const field: Field = {
                ...props.field,
                validate
            }
            if (props.fieldType === 'email' && props.field.extra
                && 'confirmationAddress' in props.field.extra && props.field.extra.confirmationAddress) {
                setUseAsConfirmationAddress(true);
                field.extra = {
                    confirmationAddress: true
                }
            }
            if (props.fieldType === 'number' && props.field.extra) {
                if ('useAsNumberOfPeople' in props.field.extra && props.field.extra.useAsNumberOfPeople) {
                    setUseAsNumberOfPeople(true);
                }
                if ('min' in props.field.extra) {
                    setMin(props.field.extra.min === undefined ? '' : props.field.extra.min.toString())
                }
                if ('max' in props.field.extra) {
                    setMax(props.field.extra.max === undefined ? '' : props.field.extra.max.toString())
                }
            }
            props.setField(field);
            setFieldLabel(props.field.label);
            setFieldDescription(props.field.description || '');
            setFieldRequired(props.field.required);
        }
        setInitializing(false);
    }, []);

    useEffect(() => {
        fieldLabelRef.current = fieldLabel;
    }, [fieldLabel]);

    function validate() {
        setValidated(true);
        return fieldLabelRef.current.trim() !== '';
    }

    function saveFieldLabel(value: string) {
        setFieldLabel(value);
        props.setField({
            ...props.field,
            label: value,
            validate
        });
    }

    function saveFieldDescription(value: string) {
        setFieldDescription(value);
        props.setField({
            ...props.field,
            description: value,
            validate
        });
    }

    function saveFieldRequired(value: boolean) {
        setFieldRequired(value);
        props.setField({
            ...props.field,
            required: value,
            validate
        });
    }

    function saveUseAsConfirmationAddress(value: boolean) {
        setUseAsConfirmationAddress(value);
        props.setField({
            ...props.field,
            extra: {
                confirmationAddress: value
            },
            validate
        });
    }

    function saveMin(value: string) {
        setMin(value);
        props.setField({
            ...props.field,
            extra: mergeExtra(props.field, { min: value.trim() === '' || isNaN(Number(value)) ? undefined : Number(value) }),
            validate
        })
    }

    function saveMax(value: string) {
        setMax(value);
        props.setField({
            ...props.field,
            extra: mergeExtra(props.field, { max: value.trim() === '' || isNaN(Number(value)) ? undefined : Number(value) }),
            validate
        })
    }

    function mergeExtra(field: Field, extra: any) {
        if (extra === undefined) {
            return field.extra;
        }
        if (field.extra) {
            return {
                ...field.extra,
                ...extra
            }
        } else {
            return extra;
        }
    }

    if (initializing) {
        return;
    }

    return (
        <>
            <div className={validated && !fieldLabel.trim() ? 'form-error' : ''}>
                <TextControl
                    label={__('Label', 'wp-open-events')}
                    onChange={saveFieldLabel}
                    value={fieldLabel}
                    required
                />
                <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
            </div>
            <TextControl
                label={__('Description (optional)', 'wp-open-events')}
                onChange={saveFieldDescription}
                value={fieldDescription}
                required
            />
            <CheckboxControl
                label={__('Required', 'wp-open-events')}
                checked={fieldRequired}
                onChange={saveFieldRequired}
                className='mt-2 mb-2'
            />
            {props.fieldType === 'email' &&
                <CheckboxControl
                    label={__('Use this address to send confirmation e-mail when the user register to the event', 'wp-open-events')}
                    checked={useAsConfirmationAddress}
                    onChange={saveUseAsConfirmationAddress}
                    className='mt-2'
                />
            }
            {props.fieldType === 'number' && useAsNumberOfPeople &&
                <>
                    <Notice status='info' className='mt-2' isDismissible={false}>
                        {__('This input will be used to allow adding multiple people with the same registration.', 'wp-open-events')}
                    </Notice>
                    <p>
                        {__('This is useful when you don\'t need to collect each participant name, but you need to know the number of seats.', 'wp-open-events')}<br />
                        {__('Example: a mother register and wants to add 3 kids, without having to specify their names.', 'wp-open-events')}
                    </p>
                </>
            }
            {props.fieldType === 'number' && !useAsNumberOfPeople &&
                <TextControl
                    label={__('Minimum value (optional)', 'wp-open-events')}
                    type='number'
                    onChange={saveMin}
                    value={min}
                />
            }
            {props.fieldType === 'number' &&
                <TextControl
                    label={__('Maximum value (optional)', 'wp-open-events')}
                    type='number'
                    onChange={saveMax}
                    value={max}
                />
            }
        </>
    );
};

export default EditInputField;