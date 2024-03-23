import React from 'react';
import EventRegistration from './EventRegistration';
import { createRoot } from 'react-dom/client';

document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('wpoe-form');
    if (typeof container !== 'undefined' && container !== null) {
        const eventId = parseInt(container.getAttribute('data-event-id'));
        const root = createRoot(container);
        root.render(<EventRegistration eventId={eventId} />);
    }
});
