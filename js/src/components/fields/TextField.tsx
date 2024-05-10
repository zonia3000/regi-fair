import React from 'react';
import { TextControl } from '@wordpress/components';
import { TextFieldProps } from '../classes/components-props';
import { __ } from '@wordpress/i18n';

const TextField = (props: TextFieldProps) => {
    function onChange(value: string) {
        props.setValue(value);
    }

    return (
        <TextControl
            label={props.label + (props.required ? '' : ` (${__('optional', 'wp-open-events')})`)}
            onChange={onChange}
            value={props.value}
            type={props.type}
            disabled={!!props.disabled}
        />
    );
};

export default TextField;