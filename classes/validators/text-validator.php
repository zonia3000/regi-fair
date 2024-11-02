<?php

if (!defined('ABSPATH')) {
  exit;
}

class REGI_FAIR_Text_Validator extends REGI_FAIR_Base_Validator
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
      throw new REGI_FAIR_Validation_Exception(message: __('Field must be a string', 'regi-fair'));
    }
    return true;
  }
}
