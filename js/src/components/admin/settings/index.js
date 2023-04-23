import React from 'react';
import ReactDOM from 'react-dom';
import Settings from './Settings';

document.addEventListener('DOMContentLoaded', function () {
    const element = document.getElementById('wpoe-settings');
    if (typeof element !== 'undefined' && element !== null) {
        ReactDOM.render(<Settings />, document.getElementById('wpoe-settings'));
    }
});
