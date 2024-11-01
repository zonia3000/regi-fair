<?php

if (!defined('ABSPATH')) {
  exit;
}

class WPOE_Text_Validator extends WPOE_Base_Validator
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
      // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
      throw new WPOE_Validation_Exception(message: __('Field must be a string', 'wp-open-events'));
    }
    return true;
  }
}
