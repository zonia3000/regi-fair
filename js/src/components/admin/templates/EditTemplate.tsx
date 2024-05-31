import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Loading from '../../Loading';
import { useNavigate, useParams } from 'react-router-dom';
import EditFormFields from '../fields/EditFormFields';
import { Button, CheckboxControl, Notice, TextControl, TextareaControl } from '@wordpress/components';
import { cleanupFields, extractError } from '../../utils';
import '../../style.css';
import { Settings } from '../../classes/settings';

const EditTemplate = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [autoremove, setAutoremove] = useState(true);
  const [formFields, setFormFields] = useState([]);
  const [notifyAdmin, setNotifyAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [editableRegistrations, setEditableRegistrations] = useState(true);
  const [customizeEmailContent, setCustomizeEmailContent] = useState(false);
  const [emailExtraContent, setEmailExtraContent] = useState('');
  const [error, setError] = useState('');
  const [valid, setValid] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (templateId === 'new') {
      setFound(true);
      apiFetch({ path: `/wpoe/v1/admin/settings` })
        .then((result) => {
          const settings = result as Settings;
          if (settings.defaultAdminEmail) {
            setNotifyAdmin(true);
            setAdminEmail(settings.defaultAdminEmail);
          }
          if (settings.defaultExtraEmailContent) {
            setCustomizeEmailContent(true);
            setEmailExtraContent(settings.defaultExtraEmailContent);
          }
        })
        .catch(err => {
          setError(extractError(err));
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      apiFetch({ path: `/wpoe/v1/admin/templates/${templateId}` })
        .then((result) => {
          setFound(true);
          const template = result as TemplateConfiguration;
          setTemplateName(template.name);
          setAutoremove(template.autoremove);
          setFormFields(template.formFields);
          if (template.adminEmail) {
            setNotifyAdmin(true);
            setAdminEmail(template.adminEmail);
          }
          setEditableRegistrations(template.editableRegistrations);
          if (template.extraEmailContent) {
            setCustomizeEmailContent(true);
            setEmailExtraContent(template.extraEmailContent);
          }
        })
        .catch(err => {
          if (err.code === 'template_not_found') {
            setFound(false);
          } else {
            setError(extractError(err));
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  async function save() {
    setValid(true);
    if (templateName.trim() === '') {
      setValid(false);
      return;
    }
    const template: TemplateConfiguration = {
      id: templateId === 'new' ? null : Number(templateId),
      name: templateName,
      formFields,
      autoremove: autoremove,
      autoremovePeriod: 30,
      waitingList: false,
      adminEmail: notifyAdmin ? adminEmail.trim() : null,
      editableRegistrations,
      extraEmailContent: customizeEmailContent ? emailExtraContent.trim() : null
    };
    setLoading(true);
    try {
      if (templateId === 'new') {
        await apiFetch({
          path: '/wpoe/v1/admin/templates',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(template),
        });
      } else {
        await apiFetch({
          path: `/wpoe/v1/admin/templates/${templateId}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...template,
            formFields: cleanupFields(template.formFields)
          })
        });
      }
      back();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  function back() {
    navigate('/');
  }

  if (loading) {
    return <Loading />;
  }

  if (!found) {
    return <p>{__('Template not found', 'wp-open-events')}</p>
  }

  return (
    <div>
      <h1>{templateId === 'new' ? __('Create template', 'wp-open-events') : __('Edit template', 'wp-open-events')}</h1>
      <div className={!valid && !templateName.trim() ? 'form-error' : ''}>
        <TextControl
          label={__('Name', 'wp-open-events')}
          onChange={setTemplateName}
          value={templateName}
          required
        />
        <span className='error-text'>{__('Field is required', 'wp-open-events')}</span>
      </div>
      <CheckboxControl
        label={__('Autoremove user data after the event', 'wp-open-events')}
        checked={autoremove}
        onChange={setAutoremove}
      />
      <CheckboxControl
        label={__('Allow the users to edit or delete their registrations', 'wp-open-events')}
        checked={editableRegistrations}
        onChange={setEditableRegistrations}
      />
      <CheckboxControl
        label={__('Notify an administrator by e-mail when a new registration is created', 'wp-open-events')}
        checked={notifyAdmin}
        onChange={setNotifyAdmin}
      />
      {notifyAdmin &&
        <TextControl
          label={__('Administrator e-mail address', 'wp-open-events')}
          onChange={setAdminEmail}
          value={adminEmail}
          required
        />
      }
      <CheckboxControl
        label={__('Add custom message to confirmation e-mail', 'wp-open-events')}
        checked={customizeEmailContent}
        onChange={setCustomizeEmailContent}
      />
      {customizeEmailContent &&
        <TextareaControl
          label={__('Custom confirmation e-mail content', 'wp-open-events')}
          onChange={setEmailExtraContent}
          value={emailExtraContent}
          help={__('This content will be added at the end of the confirmation e-mail messages. Allowed HTML tags: <b>, <i>, <a>, <hr>, <p>, <br>', 'wp-open-events')}
        />
      }

      <EditFormFields formFields={formFields} setFormFields={setFormFields} />

      <br /><hr />

      {error && <div className='mb'><Notice status='error'>{error}</Notice></div>}

      <Button onClick={save} variant='primary'>
        {__('Save', 'wp-open-events')}
      </Button>
      &nbsp;
      <Button onClick={back} variant='secondary'>
        {__('Back', 'wp-open-events')}
      </Button>
    </div>
  );
}

export default EditTemplate;
