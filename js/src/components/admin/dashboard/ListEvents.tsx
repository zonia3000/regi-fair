import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Loading from '../../Loading';
import { ListEventsProps } from '../../classes/components-props';

const ListEvents = (props: ListEventsProps) => {
    const [events, setEvents] = useState([] as EventConfiguration[]);

    useEffect(() => {
        props.setLoading(true);
        apiFetch({ path: '/wpoe/v1/events' }).then((result) => {
            setEvents(result as EventConfiguration[]);
            props.setLoading(false);
        });
    }, []);

    if (props.loading) {
        return <Loading />;
    }
    
    return (
        <>
            {events.length === 0 && __('No events found', 'wp-open-events')}
            {events.length !== 0 &&
                <table className='widefat'>
                    <thead>
                        <tr>
                            <th>{__('Name', 'wp-open-events')}</th>
                            <th>{__('Date', 'wp-open-events')}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((e: EventConfiguration) => {
                            return (<tr>
                                <td><a href='#' onClick={() => props.selectEvent(e.id)}>{e.name}</a></td>
                                <td>{e.date}</td>
                                <td></td>
                            </tr>)
                        })}
                    </tbody>
                </table>}
            <br />
        </>
    );
}

export default ListEvents;