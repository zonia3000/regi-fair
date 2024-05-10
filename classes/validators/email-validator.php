<?php

if (!defined('ABSPATH')) {
  exit;
}

class WPOE_Email_Validator extends WPOE_Base_Validator
{
  public function __construct(FormField $field)
  {
    parent::__construct($field);
  }

  public function validate(mixed $value)
  {
    if (parent::validate($value)) {
      return true;
    }
    if (!is_email($value)) {
      throw new WPOE_Validation_Exception(__('Invalid e-mail address', 'wp-open-events'));
    }
    return true;
  }
}
