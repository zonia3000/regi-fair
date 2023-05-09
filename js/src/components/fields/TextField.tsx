import React, { useState } from 'react';
import { TextControl } from '@wordpress/components';
import { TextFieldProps } from '../classes/components-props';
import { __ } from '@wordpress/i18n';

const TextField = (props: TextFieldProps) => {
    const [valid, setValid] = useState(true);

    const onChange = function (value: string) {
        // TODO: validator
        props.setValue(value);
    };

    return (
        <>
            <TextControl
                label={__(props.label, 'wp-open-events')}
                onChange={onChange}
                value={props.value}
                type={props.type}
                disabled={!!props.disabled}
            />
        </>
    );
};

export default TextField;