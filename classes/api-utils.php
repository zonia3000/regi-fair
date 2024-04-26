<?php

function generic_server_error(Exception $exception)
{
  error_log($exception);
  return new WP_Error('generic_server_error', __('A critical error happened', 'wp-open-events'), ['status' => 500]);
}

function is_events_admin()
{
  return current_user_can('manage_options');
}

function get_form_fields_schema()
{
  return [
    'type' => 'array',
    'required' => true,
    'items' => [
      'type' => 'object',
      'properties' => [
        'fieldType' => [
          'type' => 'string',
          'enum' => ['text', 'email', 'radio'],
          'required' => true
        ],
        'label' => ['type' => 'string', 'required' => true],
        'description' => ['type' => 'string'],
        'required' => ['type' => 'boolean', 'required' => true]
      ]
    ]
  ];
}
