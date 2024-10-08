<?php

if (!defined('ABSPATH')) {
  exit;
}

class WPOE_Number_Validator extends WPOE_Base_Validator
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
    if (!is_numeric($value)) {
      throw new WPOE_Validation_Exception(__('Invalid number', 'wp-open-events'));
    }
    if (preg_match('/^-?\d+$/', (string) $value)) {
      $value = (int) $value;
    } else {
      $value = (float) $value;
    }
    if ($this->field->extra !== null) {
      $numberOfPeople = use_as_number_of_people($this->field);
      if ($numberOfPeople && !is_int($value)) {
        throw new WPOE_Validation_Exception(__('Number must be an integer', 'wp-open-events'));
      }
      if ($numberOfPeople && $value < 1) {
        throw new WPOE_Validation_Exception(__('You have to register at least one person', 'wp-open-events'));
      }
      if (property_exists($this->field->extra, 'min') && $value < $this->field->extra->min) {
        throw new WPOE_Validation_Exception(sprintf(_x('Number must not be lower than %d', 'minium value', 'wp-open-events'), $this->field->extra->min));
      }
      if (property_exists($this->field->extra, 'max') && $value > $this->field->extra->max) {
        if ($numberOfPeople) {
          throw new WPOE_Validation_Exception(sprintf(_x('It is not possible to add more than %d people in the same registration', 'maximum value', 'wp-open-events'), $this->field->extra->max));
        } else {
          throw new WPOE_Validation_Exception(sprintf(_x('Number must not be greater than %d', 'maximum value', 'wp-open-events'), $this->field->extra->max));
        }
      }
    }
    return true;
  }
}
