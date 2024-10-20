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
      throw new WPOE_Validation_Exception(_x('Value must be true or false', "Do not translate 'true' and 'false'", 'wp-open-events'));
    }
    return true;
  }
}
