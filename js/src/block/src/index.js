import { registerBlockType } from '@wordpress/blocks';

import Edit from './edit';
import metadata from './block.json';

registerBlockType(metadata.name, {
    attributes: {
        eventId: {
            type: 'string',
            default: null
        }
    },
    edit: Edit
});
