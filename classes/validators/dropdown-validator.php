<?php

if (!defined('ABSPATH')) {
  exit;
}

class WPOE_Dropdown_Validator extends WPOE_Base_Validator
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
    $multiple = $this->field->extra !== null && property_exists($this->field->extra, 'multiple') && (bool) $this->field->extra->multiple;
    if ($multiple) {
      if (!is_array($value)) {
        throw new WPOE_Validation_Exception(__('Field must be an array', 'wp-open-events'));
      }
      foreach ($value as $v) {
        if (!is_string($v)) {
          throw new WPOE_Validation_Exception(__('Each element of the array must be a string', 'wp-open-events'));
        }
      }
    }
    if (!$multiple && !is_string($value)) {
      throw new WPOE_Validation_Exception(__('Field must be a string', 'wp-open-events'));
    }
    $allowed_values = [];
    if ($this->field->extra !== null && property_exists($this->field->extra, 'options') && is_array($this->field->extra->options)) {
      $allowed_values = $this->field->extra->options;
    }
    $values = $multiple ? $value : [$value];
    foreach ($values as $value) {
      if (!in_array($value, $allowed_values)) {
        throw new WPOE_Validation_Exception(__('Field value not allowed', 'wp-open-events'));
      }
    }
    return true;
  }
}
