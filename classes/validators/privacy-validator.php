<?php

if (!defined('ABSPATH')) {
  exit;
}

class WPOE_Privacy_Validator extends WPOE_Base_Validator
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
    if ($value !== true) {
      throw new WPOE_Validation_Exception(__('It is necessary to accept the privacy policy', 'wp-open-events'));
    }
    return true;
  }
}
