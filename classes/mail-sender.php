<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once(REGI_FAIR_PLUGIN_DIR . 'classes/admin/settings-manager.php');

class REGI_FAIR_Mail_Sender
{
  private static function get_headers(): array
  {
    $settings = REGI_FAIR_Settings_Manager::get_settings();
    $from_email = $settings['fromEmail'];
    return [
      'Content-Type: text/html; charset=UTF-8',
      'From:' . $from_email
    ];
  }

  /**
   * @param string|string[] $to
   */
  public static function send_registration_confirmation(REGI_FAIR_Event $event, $to, string $registration_token, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the event "%s" is confirmed', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the event "%s" is confirmed.', 'regi-fair'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('You inserted the following data:', 'regi-fair') . '</p>';

    $body .= REGI_FAIR_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= REGI_FAIR_Mail_Sender::get_registration_link_content($event, $registration_token);
    $body .= REGI_FAIR_Mail_Sender::get_extra_content($event);

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_waiting_list_confirmation(REGI_FAIR_Event $event, $to, string $registration_token, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the waiting list of the event "%s" is confirmed', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the waiting list of the event "%s" is confirmed.', 'regi-fair'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('If some seats will be available you will be automatically registered and notified by e-mail.', 'regi-fair') . '</p>'
      . '<p>' . __('You inserted the following data:', 'regi-fair') . '</p>';

    $body .= REGI_FAIR_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= REGI_FAIR_Mail_Sender::get_registration_link_content($event, $registration_token);
    $body .= REGI_FAIR_Mail_Sender::get_extra_content($event);

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_picked_from_waiting_list_confirmation(REGI_FAIR_Event $event, $to, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('New seats available for the event "%s"', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('new seats have become available for the event "%s", and you have been automatically selected from the waiting list. Your registration is confirmed.', 'regi-fair'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('You inserted the following data:', 'regi-fair') . '</p>';

    $body .= REGI_FAIR_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= REGI_FAIR_Mail_Sender::get_extra_content($event);

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  public static function send_new_registration_to_admin(REGI_FAIR_Event $event, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('New registration for the event "%s"', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear admin,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('a new registration to the event "%s" has been added.', 'regi-fair'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('The user inserted the following data:', 'regi-fair') . '</p>';

    $body .= REGI_FAIR_Mail_Sender::get_registration_fields_content($event, $values);

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  public static function send_new_waiting_list_registration_to_admin(REGI_FAIR_Event $event, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('New registration for the waiting list of event "%s"', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear admin,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('a new registration to the waiting list of event "%s" has been added.', 'regi-fair'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('The user inserted the following data:', 'regi-fair') . '</p>';

    $body .= REGI_FAIR_Mail_Sender::get_registration_fields_content($event, $values);

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_registration_updated_confirmation(REGI_FAIR_Event $event, $to, string $registration_token, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the event "%s" has been updated', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the event "%s" has been updated.', 'regi-fair'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('You inserted the following data:', 'regi-fair') . '</p>';

    $body .= REGI_FAIR_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= REGI_FAIR_Mail_Sender::get_registration_link_content($event, $registration_token);
    $body .= REGI_FAIR_Mail_Sender::get_extra_content($event);

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  public static function send_registration_updated_to_admin(REGI_FAIR_Event $event, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration updated for the event "%s"', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear admin,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('a registration to the event "%s" has been updated.', 'regi-fair'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('The user inserted the following data:', 'regi-fair') . '</p>';

    $body .= REGI_FAIR_Mail_Sender::get_registration_fields_content($event, $values);

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  public static function send_registration_updated_by_admin(REGI_FAIR_Event $event, $to, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the event "%s" has been updated', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the event "%s" has been updated by an administrator.', 'regi-fair'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('The updated data is:', 'regi-fair') . '</p>';

    $body .= REGI_FAIR_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= REGI_FAIR_Mail_Sender::get_extra_content($event);

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_registration_deleted_confirmation(REGI_FAIR_Event $event, $to)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the event "%s" has been deleted', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the event "%s" has been deleted.', 'regi-fair'), sanitize_text_field($event->name)) . '</p>';
    $body .= REGI_FAIR_Mail_Sender::get_extra_content($event);

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_registration_deleted_by_admin(REGI_FAIR_Event $event, $to)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the event "%s" has been deleted', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the event "%s" has been deleted by an administrator.', 'regi-fair'), sanitize_text_field($event->name)) . '</p>';
    $body .= REGI_FAIR_Mail_Sender::get_extra_content($event);

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  public static function send_registration_deleted_to_admin(REGI_FAIR_Event $event)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration deleted for the event "%s"', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear admin,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('a user deleted their registration to the event "%s".', 'regi-fair'), sanitize_text_field($event->name)) . '</p>';

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  /**
   * Notify the admin when new seats become available and a user is moved from the waiting list to confirmed list.
   * @param REGI_FAIR_Event $event
   * @param int[] $registrations
   * @return void
   */
  public static function send_registrations_picked_from_waiting_list_to_admin(REGI_FAIR_Event $event, array $registrations)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registrations picked from the waiting list of event "%s"', 'regi-fair'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear admin,', 'regi-fair') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('the following registration identifiers for the event "%s" were moved from waiting list to confirmed:', 'regi-fair'), sanitize_text_field($event->name))
      . ' ' . implode(', ', $registrations)
      . '</p>';

    $headers = REGI_FAIR_Mail_Sender::get_headers();
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  private static function get_registration_fields_content(REGI_FAIR_Event $event, array $values): string
  {
    $content = '<ul>';
    foreach ($event->formFields as $field) {
      if (!array_key_exists($field->id, $values)) {
        continue;
      }
      $type = $field->fieldType;
      if ($type === 'privacy') {
        $label = __("Privacy policy", "regi-fair");
      } else {
        $label = $field->label;
      }
      $value = $values[$field->id];
      $content .= '<li><strong>' . sanitize_text_field($label) . '</strong>: '
        . REGI_FAIR_Mail_Sender::get_registration_value($type, $value) . '</li>';
    }
    $content .= '</ul>';
    return $content;
  }

  private static function get_registration_value(string $type, mixed $value)
  {
    if ($type === 'checkbox') {
      if ((int) $value === 1) {
        return __('Yes', 'regi-fair');
      } else {
        return __('No', 'regi-fair');
      }
    }
    if ($type === 'privacy') {
      return __('Accepted', 'regi-fair');
    }
    if (is_numeric($value)) {
      return $value;
    }
    if (is_string($value)) {
      return sanitize_text_field($value);
    }
    if (is_array($value)) {
      return implode(', ', map_deep($value, 'sanitize_text_field'));
    }
  }

  private static function get_registration_link_content(REGI_FAIR_Event $event, string $registration_token): string
  {
    $content = '';
    if ($event->editableRegistrations && count($event->posts) > 0) {
      $content .= '<p>' . __('You can modify or delete your registration by clicking on the following link:', 'regi-fair') . '</p>'
        . '<p><a href="' . $event->posts[0]->permalink . '#registration=' . $registration_token . '">' .
        $event->posts[0]->title
        . '</a></p>';
    }
    return $content;
  }

  private static function get_extra_content(REGI_FAIR_Event $event): string
  {
    if ($event->extraEmailContent !== null) {
      return $event->extraEmailContent;
    }
    return '';
  }
}
