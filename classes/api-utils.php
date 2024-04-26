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
        'id' => ['type' => 'integer', 'required' => false, 'minimum' => 1],
        'fieldType' => [
          'type' => 'string',
          'enum' => ['text', 'email', 'radio'],
          'required' => true
        ],
        'label' => ['type' => 'string', 'required' => true],
        'required' => ['type' => 'boolean', 'required' => true],
        'description' => ['type' => 'string', 'required' => false],
        'extra' => ['type' => 'object', 'required' => false]
      ]
    ]
  ];
}

/**
 * @param WP_REST_Request $request
 * @return FormField[]
 */
function get_form_field_from_request($request)
{
  $form_fields = [];
  $values = $request->get_param('formFields');
  $i = 0;
  foreach ($values as $value) {
    $field = new FormField();
    if (isset($value['id']) && $value['id'] !== null) {
      $field->id = $value['id'];
    }
    $field->fieldType = $value['fieldType'];
    $field->label = $value['label'];
    $field->required = $value['required'];
    if (isset($value['description']) && $value['description'] !== null) {
      $field->description = $value['description'];
    }
    if (isset($value['extra']) && $value['extra'] !== null) {
      $value->extra = $value['extra'];
    }
    $field->position = $i;
    $form_fields[] = $field;
    $i++;
  }
  return $form_fields;
}
