<?php

if (!defined('ABSPATH')) {
  exit;
}

class WPOE_Checkbox_Validator extends WPOE_Base_Validator
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
    if ($value !== true && $value !== false) {
      // phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
      throw new WPOE_Validation_Exception(
        /* translators: Do not translate 'true' and 'false' */
        __('Value must be true or false', 'wp-open-events')
      );
      // phpcs:enable
    }
    return true;
  }
}
