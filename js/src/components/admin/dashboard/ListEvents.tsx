import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Loading from '../../Loading';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@wordpress/components';

const ListEvents = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([] as EventConfiguration[]);

    useEffect(() => {
        setLoading(true);
        apiFetch({ path: '/wpoe/v1/admin/events' }).then((result) => {
            setEvents(result as EventConfiguration[]);
            setLoading(false);
        });
    }, []);

    function newEvent() {
        navigate('/event/new');
    }

    if (loading) {
        return <Loading />;
    }

    return (
        <div>
            <h1 className='wp-heading-inline'>
                {__('Your events', 'wp-open-events')} &nbsp;
            </h1>
            <Button onClick={newEvent} variant='primary'>
                {__('Add event', 'wp-open-events')}
            </Button>

            {events.length === 0 && <p>{__('No events found', 'wp-open-events')}</p>}
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
                            return (<tr key={e.id}>
                                <td>
                                    <Link to={`/event/${e.id}`}>{e.name}</Link>
                                </td>
                                <td>{e.date}</td>
                                <td></td>
                            </tr>)
                        })}
                    </tbody>
                </table>}
            <br />
        </div>
    );
}

export default ListEvents;