import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Loading from '../../Loading';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Modal, Notice, SelectControl } from '@wordpress/components';
import { extractError } from '../../utils';

const ListEvents = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([] as EventConfiguration[]);
    const [error, setError] = useState('');
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [chooseTemplate, setChooseTemplate] = useState(false);
    const [templatesLoading, setTemplatesLoading] = useState(true);
    const [templates, setTemplates] = useState([] as Array<{ value: string, label: string }>);
    const [templatesError, setTemplatesError] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    useEffect(() => {
        setLoading(true);
        apiFetch({ path: '/wpoe/v1/admin/events' })
            .then((result) => {
                setEvents(result as EventConfiguration[]);
            })
            .catch(err => {
                setError(extractError(err));
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    function newEventFromScratch() {
        navigate('/event/new');
    }

    function newEventFromTemplate() {
        navigate(`/event/new?template=${selectedTemplateId}`);
    }

    function openCreateEventModal() {
        setShowCreateEventModal(true);
    }

    function closeCreateEventModal() {
        setShowCreateEventModal(false);
        setChooseTemplate(false);
        setSelectedTemplateId('');
    }

    async function loadTemplates() {
        setChooseTemplate(true);
        setTemplatesLoading(true);
        try {
            const result = await apiFetch({ path: '/wpoe/v1/admin/templates' });
            const templates = (result as TemplateConfiguration[])
                .map(template => {
                    return {
                        value: template.id.toString(),
                        label: template.name
                    };
                });
            if (templates.length > 0) {
                setSelectedTemplateId(templates[0].value);
            }
            setTemplates(templates);
        } catch (err) {
            setTemplatesError(extractError(err));
        } finally {
            setTemplatesLoading(false);
        }
    }

    function openCreateTemplatePage() {
        const newTemplatePage = window.location.toString().replace(/=wpoe-events.*/, '=wpoe-templates#/template/new');
        window.location.href = newTemplatePage;
    }

    if (loading) {
        return <Loading />;
    }

    return (
        <div>
            <h1 className='wp-heading-inline'>
                {__('Your events', 'wp-open-events')} &nbsp;
            </h1>
            <Button onClick={openCreateEventModal} variant='primary'>
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

            {error && <Notice status='error'>{error}</Notice>}

            {showCreateEventModal &&
                <Modal title={__('Create event', 'wp-open-events')} onRequestClose={closeCreateEventModal}>
                    {!chooseTemplate && <>
                        <Button variant='primary' onClick={loadTemplates}>
                            {__('From template', 'wp-open-events')}
                        </Button>
                        &nbsp;
                        <Button variant='primary' onClick={newEventFromScratch}>
                            {__('From scratch', 'wp-open-events')}
                        </Button>
                    </>}
                    {chooseTemplate && templatesLoading && <Loading />}
                    {chooseTemplate && !templatesLoading && templatesError && <Notice status='error'>{templatesError}</Notice>}
                    {chooseTemplate && !templatesLoading && !templatesError && templates.length === 0 && <>
                        <p>{__('No templates found', 'wp-open-events')}</p>
                        <Button variant='primary' onClick={openCreateTemplatePage}>
                            {__('Create your first template', 'wp-open-events')}
                        </Button>
                    </>}
                    {chooseTemplate && !templatesLoading && !templatesError && templates.length > 0 &&
                        <>
                            <SelectControl
                                label={__('Select template', 'wp-open-events')}
                                options={templates}
                                onChange={setSelectedTemplateId} />
                            <Button variant='primary' onClick={newEventFromTemplate}>
                                {__('Create', 'wp-open-events')}
                            </Button>
                        </>}
                </Modal>
            }
        </div>
    );
}

export default ListEvents;