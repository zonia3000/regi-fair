<?php

if (!defined('ABSPATH')) {
  exit;
}

class REGI_FAIR_Dropdown_Validator extends REGI_FAIR_Base_Validator
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
    // phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
    $multiple = $this->field->extra !== null && property_exists($this->field->extra, 'multiple') && (bool) $this->field->extra->multiple;
    if ($multiple) {
      if (!is_array($value)) {
        throw new REGI_FAIR_Validation_Exception(__('Field must be an array', 'regi-fair'));
      }
      foreach ($value as $v) {
        if (!is_string($v)) {
          throw new REGI_FAIR_Validation_Exception(message: __('Each element of the array must be a string', 'regi-fair'));
        }
      }
    }
    if (!$multiple && !is_string($value)) {
      throw new REGI_FAIR_Validation_Exception(__('Field must be a string', 'regi-fair'));
    }
    $allowed_values = [];
    if ($this->field->extra !== null && property_exists($this->field->extra, 'options') && is_array($this->field->extra->options)) {
      $allowed_values = $this->field->extra->options;
    }
    $values = $multiple ? $value : [$value];
    foreach ($values as $value) {
      if (!in_array($value, $allowed_values)) {
        throw new REGI_FAIR_Validation_Exception(message: __('Field value not allowed', 'regi-fair'));
      }
    }
    // phpcs:enable
    return true;
  }
}
