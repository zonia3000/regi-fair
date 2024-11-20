<?php

if (!defined('ABSPATH')) {
  exit;
}

class REGI_FAIR_Number_Validator extends REGI_FAIR_Base_Validator
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
    // phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
    if (!is_numeric($value)) {
      throw new REGI_FAIR_Validation_Exception(__('Invalid number', 'regi-fair'));
    }
    if (preg_match('/^-?\d+$/', (string) $value)) {
      $value = (int) $value;
    } else {
      $value = (float) $value;
    }
    if ($this->field->extra !== null) {
      $numberOfPeople = REGI_FAIR_API_Utils::use_as_number_of_people($this->field);
      if ($numberOfPeople && !is_int($value)) {
        throw new REGI_FAIR_Validation_Exception(message: __('Number must be an integer', 'regi-fair'));
      }
      if ($numberOfPeople && $value < 1) {
        throw new REGI_FAIR_Validation_Exception(__('You have to register at least one person', 'regi-fair'));
      }
      if (property_exists($this->field->extra, 'min') && $value < $this->field->extra->min) {
        throw new REGI_FAIR_Validation_Exception(
          /* translators: %d is replaced with the minimum value */
          sprintf(__('Number must not be lower than %d', 'regi-fair'), $this->field->extra->min)
        );
      }
      if (property_exists($this->field->extra, 'max') && $value > $this->field->extra->max) {
        if ($numberOfPeople) {
          throw new REGI_FAIR_Validation_Exception(
            /* translators: %d is replaced with the maximum allowed participants value */
            sprintf(__('It is not possible to add more than %d people in the same registration', 'regi-fair'), $this->field->extra->max)
          );
        } else {
          throw new REGI_FAIR_Validation_Exception(
            /* translators: %d is replaced with the maximum value */
            sprintf(__('Number must not be greater than %d', 'regi-fair'), $this->field->extra->max)
          );
        }
      }
    }
    // phpcs:enable
    return true;
  }
}
