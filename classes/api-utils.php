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
          'enum' => ['text', 'email', 'number', 'radio', 'dropdown', 'checkbox', 'privacy'],
          'required' => true
        ],
        'label' => ['type' => 'string', 'required' => true],
        'required' => ['type' => 'boolean', 'required' => true],
        'description' => ['type' => 'string', 'required' => false],
        'extra' => [
          'type' => 'object',
          'properties' => [
            'confirmationAddress' => ['type' => 'boolean', 'required' => false],
            'useWpUserEmail' => ['type' => 'boolean', 'required' => false],
            'min' => ['type' => 'integer', 'required' => false],
            'max' => ['type' => 'integer', 'required' => false],
            'useAsNumberOfPeople' => ['type' => 'boolean', 'required' => false],
            'options' => ['type' => 'array', 'required' => false, 'items' => ['type' => 'string']],
            'multiple' => ['type' => 'boolean', 'required' => false]
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
      $field->extra = (object) $value['extra'];
      if (use_as_number_of_people($field)) {
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
  if (array_key_exists('useWpUserEmail', $extra) && $field->fieldType !== 'email') {
    throw new WPOE_Validation_Exception(__('Only email fields can have the WP user option', 'wp-open-events'));
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
  if (array_key_exists('multiple', $extra) && $field->fieldType !== 'dropdown') {
    throw new WPOE_Validation_Exception(__('Only dropdown fields can have a multiple field', 'wp-open-events'));
  }
}

function strip_forbidden_html_tags(string $content): string
{
  return wp_kses(
    $content,
    ['b' => [], 'i' => [], 'a' => ['href' => [], 'title' => []], 'hr' => [], 'p' => [], 'br' => []]
  );
}

function get_user_email(WPOE_Event $event, array $input): array
{
  $user_email = [];
  foreach ($event->formFields as $field) {
    if (use_as_confirmation_address($field)) {
      $user_email[] = $input[$field->id];
    }
  }
  return $user_email;
}

function get_number_of_people(WPOE_Event $event, array $input): int
{
  foreach ($event->formFields as $field) {
    if (use_as_number_of_people($field)) {
      $count = (int) $input[$field->id];
      if ($count === 0) {
        return 1;
      }
      return $count;
    }
  }
  return 1;
}

function use_as_confirmation_address(WPOE_Form_Field $field): bool
{
  return $field->fieldType === 'email' && $field->extra !== null
    && property_exists($field->extra, 'confirmationAddress')
    && $field->extra->confirmationAddress === true;
}

function use_as_number_of_people(WPOE_Form_Field $field): bool
{
  return $field->fieldType === 'number' && $field->extra !== null
    && property_exists($field->extra, 'useAsNumberOfPeople')
    && $field->extra->useAsNumberOfPeople === true;
}

function use_wp_user_email(WPOE_Form_Field $field): bool
{
  return $field->fieldType === 'email' && $field->extra !== null
    && property_exists($field->extra, 'useWpUserEmail')
    && $field->extra->useWpUserEmail === true;
}

function is_multiple(WPOE_Form_Field $field): bool
{
  return $field->fieldType === 'dropdown' && $field->extra !== null
    && property_exists($field->extra, 'multiple')
    && $field->extra->multiple === true;
}

function set_registered_user_email(WPOE_Event $event, &$input)
{
  if (!is_array($input)) {
    return;
  }
  $email = get_current_user_email();
  if ($email === null) {
    return;
  }
  foreach ($event->formFields as $field) {
    if (use_wp_user_email($field)) {
      $input[$field->id] = $email;
    }
  }
}

function get_current_user_email(): string|null
{
  $user = wp_get_current_user();
  if ($user->exists() && $user->has_prop('user_email')) {
    return $user->get('user_email');
  }
  return null;
}

function validate_event_request(WPOE_Event $event, $input): WP_Error|WP_REST_Response|null
{
  if (!is_array($input)) {
    return new WP_Error('invalid_form_fields', __('The payload must be an array', 'wp-open-events'), ['status' => 400]);
  }
  if (count(array_keys($input)) !== count($event->formFields)) {
    return new WP_Error('invalid_form_fields', __('Invalid number of fields', 'wp-open-events'), ['status' => 400]);
  }

  foreach ($event->formFields as $field) {
    if (!key_exists($field->id, $input)) {
      return new WP_Error(
        'invalid_form_fields',
        /* translators: %d is replaced with the id of the field */
        sprintf(__('Missing field %d', 'wp-open-events'), $field->id),
        ['status' => 400]
      );
    }
  }

  $errors = [];
  foreach ($event->formFields as $field) {
    try {
      WPOE_Validator::validate($field, $input[$field->id]);
    } catch (WPOE_Validation_Exception $ex) {
      $errors[$field->id] = $ex->getMessage();
    }
  }
  if (count($errors) > 0) {
    return new WP_REST_Response([
      'code' => 'invalid_form_fields',
      'message' => __('Some fields are not valid', 'wp-open-events'),
      'data' => [
        'status' => 400,
        'fieldsErrors' => (object) $errors
      ]
    ], 400);
  }
  return null;
}

function get_no_more_seats_error(WPOE_Event $event): WP_Error|WP_REST_Response
{
  foreach ($event->formFields as $field) {
    if (use_as_number_of_people($field)) {
      // If there is a "number of people" input put the error there
      return new WP_REST_Response([
        'code' => 'invalid_form_fields',
        'message' => __('Unable to register the specified number of people', 'wp-open-events'),
        'data' => [
          'status' => 400,
          'fieldsErrors' => (object) [
            $field->id => __('The number is greater than the available number of seats', 'wp-open-events')
          ]
        ]
      ], 400);
    }
  }
  // Otherwise just return a generic error message about the number of seats
  return new WP_Error('no_more_seats', __('No more seats available', 'wp-open-events'), ['status' => 400]);
}
