<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once (WPOE_PLUGIN_DIR . 'classes/validators/validation-exception.php');
require_once (WPOE_PLUGIN_DIR . 'classes/validators/base-validator.php');
require_once (WPOE_PLUGIN_DIR . 'classes/validators/text-validator.php');
require_once (WPOE_PLUGIN_DIR . 'classes/validators/email-validator.php');
require_once (WPOE_PLUGIN_DIR . 'classes/validators/radio-validator.php');

class WPOE_Validator
{
  public static function validate(WPOE_Form_Field $form_field, mixed $input)
  {
    switch ($form_field->fieldType) {
      case 'text':
        $validator = new WPOE_Text_Validator($form_field);
        break;
      case 'email':
        $validator = new WPOE_Email_Validator($form_field);
        break;
      case 'radio':
        $validator = new WPOE_Radio_Validator($form_field);
        break;
      default:
        throw new Exception('Unsupported field type ' . $form_field->fieldType);
    }
    $validator->validate($input);
  }
}
