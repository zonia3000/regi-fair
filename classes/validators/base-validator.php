<?php

if (!defined('ABSPATH')) {
  exit;
}

abstract class WPOE_Base_Validator
{
  /**
   * @var FormField
   */
  protected $field;

  public function __construct(FormField $field)
  {
    $this->field = $field;
  }

  /**
   * @return bool true if the field is optional and empty, meaning that subsequent validation must be skipped
   */
  public function validate(mixed $value)
  {
    $field_is_empty = $value === null || (is_string($value) && trim($value) === '');
    if ($this->field->required && $field_is_empty) {
      throw new WPOE_Validation_Exception(__('Required field', 'wp-open-events'));
    } else if ($field_is_empty) {
      return true;
    }
    return false;
  }
}
