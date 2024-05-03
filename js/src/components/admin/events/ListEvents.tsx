import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Loading from '../../Loading';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Icon, Modal, Notice, SelectControl, Spinner } from '@wordpress/components';
import { extractError } from '../../utils';
import '../../style.css';

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
    const [eventToDelete, setEventToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [selectedEventWithMultipleReferences, setSelectedEventWithMultipleReferences] = useState(null);
    const [loadingEventReferences, setLoadingEventReferences] = useState(false);
    const [loadingEventReferencesError, setLoadingEventReferencesError] = useState('');
    const [referencingPosts, setReferencingPosts] = useState([] as Array<{ title: string, permalink: string }>);

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

    function openDeleteEventModal(event: EventConfiguration) {
        setEventToDelete(event);
    }

    function closeDeleteEventModal() {
        setEventToDelete(null);
        setLoadingEventReferencesError('');
        setReferencingPosts([]);
        setLoadingEventReferences(false);
    }

    async function confirmDeleteEvent() {
        setDeleting(true);
        try {
            await apiFetch({
                path: `/wpoe/v1/admin/events/${eventToDelete.id}`,
                method: 'DELETE'
            });
            setEvents(events.filter(e => e.id !== eventToDelete.id));
            setEventToDelete(null);
        } catch (err) {
            setDeleteError(extractError(err));
        } finally {
            setDeleting(false);
        }
    }

    async function openEventWithMultipleReferencesModal(event: EventConfiguration) {
        setSelectedEventWithMultipleReferences(event);
        setLoadingEventReferences(true);
        try {
            const references = await apiFetch({ path: `/wpoe/v1/admin/events/${event.id}/references` })
            setReferencingPosts(references as Array<{ title: string, permalink: string }>);
        } catch (err) {
            setLoadingEventReferencesError(extractError(err));
        } finally {
            setLoadingEventReferences(false);
        }
    }

    function closeEventWithMultipleReferencesModal() {
        setSelectedEventWithMultipleReferences(null);
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
                <table className='widefat mt'>
                    <thead>
                        <tr>
                            <th>{__('Name', 'wp-open-events')}</th>
                            <th>{__('Date', 'wp-open-events')}</th>
                            <th>{__('Registrations', 'wp-open-events')}</th>
                            <th>{__('Post', 'wp-open-events')}</th>
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
                                <td>
                                    {e.registrations === 0 && '-'}
                                    {e.registrations > 0 &&
                                        <Link to={`/event/${e.id}/registrations`}>{e.registrations}</Link>
                                    }
                                </td>
                                <td>
                                    {!e.postPermalink && '-'}
                                    {e.postPermalink &&
                                        <Link to={e.postPermalink} target='_blank'>{e.postTitle}</Link>
                                    }
                                    {e.hasMultipleReferences &&
                                        <Button className='warning-sign' variant='link' onClick={() => openEventWithMultipleReferencesModal(e)}>
                                            <Icon icon='warning' />
                                        </Button>
                                    }
                                </td>
                                <td>
                                    <Button variant='primary' onClick={() => openDeleteEventModal(e)}>Delete</Button>
                                </td>
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

            {eventToDelete !== null &&
                <Modal title={__('Delete event', 'wp-open-events')} onRequestClose={closeDeleteEventModal}>
                    <p>{__('Do you really want to delete this event?', 'wp-open-events')}</p>
                    <p><strong>{__('WARNING: all the saved registrations will be deleted', 'wp-open-events')}</strong></p>
                    {deleteError && <Notice status='error'>{deleteError}</Notice>}
                    {deleting && <p><Spinner />{__('Deleting...', 'wp-open-events')}</p>}
                    <Button variant='primary' onClick={confirmDeleteEvent} disabled={deleting}>
                        {__('Confirm', 'wp-open-events')}
                    </Button>
                    &nbsp;
                    <Button variant='secondary' onClick={closeDeleteEventModal}>
                        {__('Cancel', 'wp-open-events')}
                    </Button>
                </Modal>
            }

            {selectedEventWithMultipleReferences !== null &&
                <Modal title={__('Event form is referenced in multiple posts', 'wp-open-events')} onRequestClose={closeEventWithMultipleReferencesModal}>
                    <p>{__('This plugin expects that an event form is referenced only in one published post.', 'wp-open-events')}</p>
                    <p><strong>{__('Please, ensure that you have only one post referencing this event.', 'wp-open-events')}</strong></p>
                    <p>{__('The following posts are referencing the same event form:', 'wp-open-events')}</p>
                    <ul>
                        {referencingPosts.map((p, i) => <li key={`reference_${i}`}>
                            <Link to={p.permalink} target='_blank'>{p.title}</Link>
                        </li>)}
                    </ul>
                    {loadingEventReferencesError && <Notice status='error'>{loadingEventReferencesError}</Notice>}
                    {loadingEventReferences && <p><Spinner />{__('Loading...', 'wp-open-events')}</p>}
                </Modal>
            }
        </div>
    );
}

export default ListEvents;