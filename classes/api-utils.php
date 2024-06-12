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
          'enum' => ['text', 'email', 'number', 'radio'],
          'required' => true
        ],
        'label' => ['type' => 'string', 'required' => true],
        'required' => ['type' => 'boolean', 'required' => true],
        'description' => ['type' => 'string', 'required' => false],
        'extra' => [
          'type' => 'object',
          'properties' => [
            'confirmationAddress' => ['type' => 'boolean', 'required' => false],
            'min' => ['type' => 'integer', 'required' => false],
            'max' => ['type' => 'integer', 'required' => false],
            'useAsNumberOfPeople' => ['type' => 'boolean', 'required' => false],
            'options' => ['type' => 'array', 'required' => false, 'items' => ['type' => 'string']]
          ],
          'required' => false,
          'additionalProperties' => false
        ]
      ],
      'additionalProperties' => false
    ]
  ];
}

/**
 * @param WP_REST_Request $request
 * @return WPOE_Form_Field[]
 */
function get_form_field_from_request($request)
{
  $form_fields = [];
  $values = $request->get_param('formFields');
  $i = 0;
  $max_participants_set = false;
  foreach ($values as $value) {
    $field = new WPOE_Form_Field();
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
      validate_extra($field, $value['extra']);
      $field->extra = $value['extra'];
      if (array_key_exists('useAsNumberOfPeople', $value['extra']) && $value['extra']['useAsNumberOfPeople'] === true) {
        if ($max_participants_set) {
          throw new WPOE_Validation_Exception(__('Only one field of type "number of people" is allowed', 'wp-open-events'));
        } else {
          $max_participants_set = true;
        }
      }
    }
    $field->position = $i;
    $form_fields[] = $field;
    $i++;
  }
  return $form_fields;
}

function validate_extra(WPOE_Form_Field $field, array $extra)
{
  if (array_key_exists('confirmationAddress', $extra) && $field->fieldType !== 'email') {
    throw new WPOE_Validation_Exception(__('Only email fields can be set as confirmation address', 'wp-open-events'));
  }
  if (array_key_exists('useAsNumberOfPeople', $extra) && $field->fieldType !== 'number') {
    throw new WPOE_Validation_Exception(__('Only numeric fields can be used to set the number of people', 'wp-open-events'));
  }
  if (array_key_exists('min', $extra) && $field->fieldType !== 'number') {
    throw new WPOE_Validation_Exception(__('Only numeric fields can have a minimum value', 'wp-open-events'));
  }
  if (array_key_exists('max', $extra) && $field->fieldType !== 'number') {
    throw new WPOE_Validation_Exception(__('Only numeric fields can have a maximum value', 'wp-open-events'));
  }
}

function strip_forbidden_html_tags(string $content): string
{
  return wp_kses(
    $content,
    ['b' => [], 'i' => [], 'a' => ['href' => [], 'title' => []], 'hr' => [], 'p' => [], 'br' => []]
  );
}
