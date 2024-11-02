<?php

if (!defined('ABSPATH')) {
  exit;
}

class REGI_FAIR_Checkbox_Validator extends REGI_FAIR_Base_Validator
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
    if ($value !== true && $value !== false) {
      // phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
      throw new REGI_FAIR_Validation_Exception(
        /* translators: Do not translate 'true' and 'false' */
        __('Value must be true or false', 'regi-fair')
      );
      // phpcs:enable
    }
    return true;
  }
}
