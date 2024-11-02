<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once(REGI_FAIR_PLUGIN_DIR . 'classes/validators/validation-exception.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/validators/base-validator.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/validators/text-validator.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/validators/email-validator.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/validators/number-validator.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/validators/radio-validator.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/validators/dropdown-validator.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/validators/checkbox-validator.php');
require_once(REGI_FAIR_PLUGIN_DIR . 'classes/validators/privacy-validator.php');

class REGI_FAIR_Validator
{
  public static function validate(REGI_FAIR_Form_Field $form_field, mixed $input)
  {
    switch ($form_field->fieldType) {
      case 'text':
        $validator = new REGI_FAIR_Text_Validator($form_field);
        break;
      case 'email':
        $validator = new REGI_FAIR_Email_Validator($form_field);
        break;
      case 'number':
        $validator = new REGI_FAIR_Number_Validator($form_field);
        break;
      case 'radio':
        $validator = new REGI_FAIR_Radio_Validator($form_field);
        break;
      case 'dropdown':
        $validator = new REGI_FAIR_Dropdown_Validator($form_field);
        break;
      case 'checkbox':
        $validator = new REGI_FAIR_Checkbox_Validator($form_field);
        break;
      case 'privacy':
        $validator = new REGI_FAIR_Privacy_Validator($form_field);
        break;
      default:
        throw new REGI_FAIR_Validation_Exception('Unsupported field type ' . esc_html($form_field->fieldType));
    }
    $validator->validate($input);
  }
}
