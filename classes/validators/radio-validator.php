<?php

if (!defined('ABSPATH')) {
  exit;
}

class REGI_FAIR_Radio_Validator extends REGI_FAIR_Base_Validator
{
  public function __construct(REGI_FAIR_Form_Field $field)
  {
    parent::__construct($field);
  }

  public function validate(mixed $value)
  {
    if (parent::validate($value)) {
      return true;
    }
    if (!is_string($value)) {
      // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
      throw new REGI_FAIR_Validation_Exception(__('Field must be a string', 'regi-fair'));
    }
    $allowed_values = [];
    if ($this->field->extra !== null && property_exists($this->field->extra, 'options') && is_array($this->field->extra->options)) {
      $allowed_values = $this->field->extra->options;
    }
    if (!in_array($value, $allowed_values)) {
      // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
      throw new REGI_FAIR_Validation_Exception(message: __('Field value not allowed', 'regi-fair'));
    }
    return true;
  }
}
