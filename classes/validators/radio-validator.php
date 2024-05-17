<?php

if (!defined('ABSPATH')) {
  exit;
}

class WPOE_Radio_Validator extends WPOE_Base_Validator
{
  public function __construct(WPOE_Form_Field $field)
  {
    parent::__construct($field);
  }

  public function validate(mixed $value)
  {
    if (parent::validate($value)) {
      return true;
    }
    if (!is_string($value)) {
      throw new WPOE_Validation_Exception(__('Field must be a string', 'wp-open-events'));
    }
    $allowed_values = [];
    if ($this->field->extra !== null && property_exists($this->field->extra, 'options') && is_array($this->field->extra->options)) {
      $allowed_values = $this->field->extra->options;
    }
    if (!in_array($value, $allowed_values)) {
      throw new WPOE_Validation_Exception(__('Field value not allowed', 'wp-open-events'));
    }
    return true;
  }
}
