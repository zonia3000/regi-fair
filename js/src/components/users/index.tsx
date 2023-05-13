import React from 'react';
import ReactDOM from 'react-dom';
import EventRegistration from './EventRegistration';

document.addEventListener('DOMContentLoaded', function () {
    const element = document.getElementById('wpoe-form');
    console.log('c');
    if (typeof element !== 'undefined' && element !== null) {
        const eventId = parseInt(element.getAttribute('data-event-id'));
        ReactDOM.render(<EventRegistration eventId={eventId} />, document.getElementById('wpoe-form'));
    }
});
