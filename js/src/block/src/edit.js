import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import React, { useState, useEffect } from 'react';
import { SelectControl } from '@wordpress/components';
import Form from 'wp-open-events/Form';
import Loading from 'wp-open-events/Loading';

export default function Edit() {
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(true);
    const [eventsOptions, setEventsOptions] = useState([]);
    const [eventId, setEventId] = useState('');

    useEffect(() => {
        apiFetch({ path: '/wpoe/v1/events' }).then((result) => {
            setEventsOptions(
                [{
                    label: __('Select...', 'wp-open-events'),
                    value: ''
                }].concat(
                    result.map(event => {
                        return {
                            value: event.id,
                            label: event.name
                        };
                    })
                )
            );
            setLoading(false);
        });
    }, []);

    return (
        <div {...useBlockProps()}>
            {loading && <Loading />}

            {!loading && !eventId &&
                <SelectControl
                    label={__('Select event', 'wp-open-events')}
                    options={eventsOptions}
                    onChange={setEventId} />
            }

            {!loading && eventId &&
                <Form loading={formLoading} setLoading={setFormLoading} eventId={eventId} disabled={true} />
            }
        </div>
    );
}
