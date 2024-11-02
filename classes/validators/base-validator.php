<?php

if (!defined('ABSPATH')) {
  exit;
}

abstract class REGI_FAIR_Base_Validator
{
  /**
   * @var REGI_FAIR_Form_Field
   */
  protected $field;

  public function __construct(REGI_FAIR_Form_Field $field)
  {
    $this->field = $field;
  }

  /**
   * @return bool true if the field is optional and empty, meaning that subsequent validation must be skipped
   */
  public function validate(mixed $value)
  {
    $field_is_empty = $value === null
      || (is_string($value) && trim($value) === '')
      || (is_array($value) && count($value) === 0);
    if ($this->field->required && $field_is_empty) {
      // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
      throw new REGI_FAIR_Validation_Exception(__('Required field', 'regi-fair'));
    } else if ($field_is_empty) {
      return true;
    }
    return false;
  }
}
