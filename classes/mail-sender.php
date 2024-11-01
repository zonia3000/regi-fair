<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once(WPOE_PLUGIN_DIR . 'classes/admin/settings-manager.php');

class WPOE_Mail_Sender
{
  private static function get_headers(): array
  {
    $settings = WPOE_Settings_Manager::get_settings();
    $from_email = $settings['fromEmail'];
    return [
      'Content-Type: text/html; charset=UTF-8',
      'From:' . $from_email
    ];
  }

  /**
   * @param string|string[] $to
   */
  public static function send_registration_confirmation(WPOE_Event $event, $to, string $registration_token, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the event "%s" is confirmed', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the event "%s" is confirmed.'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('You inserted the following data:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= WPOE_Mail_Sender::get_registration_link_content($event, $registration_token);
    $body .= WPOE_Mail_Sender::get_extra_content($event);

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_waiting_list_confirmation(WPOE_Event $event, $to, string $registration_token, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the waiting list of the event "%s" is confirmed', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the waiting list of the event "%s" is confirmed.'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('If some seats will be available you will be automatically registered and notified by e-mail.') . '</p>'
      . '<p>' . __('You inserted the following data:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= WPOE_Mail_Sender::get_registration_link_content($event, $registration_token);
    $body .= WPOE_Mail_Sender::get_extra_content($event);

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_picked_from_waiting_list_confirmation(WPOE_Event $event, $to, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('New seats available for the event "%s"', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('new seats have become available for the event "%s", and you have been automatically selected from the waiting list. Your registration is confirmed.'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('You inserted the following data:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= WPOE_Mail_Sender::get_extra_content($event);

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  public static function send_new_registration_to_admin(WPOE_Event $event, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('New registration for the event "%s"', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear admin,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('a new registration to the event "%s" has been added.'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('The user inserted the following data:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  public static function send_new_waiting_list_registration_to_admin(WPOE_Event $event, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('New registration for the waiting list of event "%s"', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear admin,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('a new registration to the waiting list of event "%s" has been added.'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('The user inserted the following data:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_registration_updated_confirmation(WPOE_Event $event, $to, string $registration_token, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the event "%s" has been updated', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the event "%s" has been updated.'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('You inserted the following data:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= WPOE_Mail_Sender::get_registration_link_content($event, $registration_token);
    $body .= WPOE_Mail_Sender::get_extra_content($event);

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  public static function send_registration_updated_to_admin(WPOE_Event $event, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration updated for the event "%s"', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear admin,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('a registration to the event "%s" has been updated.'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('The user inserted the following data:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  public static function send_registration_updated_by_admin(WPOE_Event $event, $to, array $values)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the event "%s" has been updated', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the event "%s" has been updated by an administrator.'), sanitize_text_field($event->name)) . '</p>'
      . '<p>' . __('The updated data is:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= WPOE_Mail_Sender::get_extra_content($event);

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_registration_deleted_confirmation(WPOE_Event $event, $to)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the event "%s" has been deleted', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the event "%s" has been deleted.'), sanitize_text_field($event->name)) . '</p>';
    $body .= WPOE_Mail_Sender::get_extra_content($event);

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_registration_deleted_by_admin(WPOE_Event $event, $to)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration to the event "%s" has been deleted', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear user,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('your registration to the event "%s" has been deleted by an administrator.'), sanitize_text_field($event->name)) . '</p>';
    $body .= WPOE_Mail_Sender::get_extra_content($event);

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($to, $subject, $body, $headers);
  }

  public static function send_registration_deleted_to_admin(WPOE_Event $event)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registration deleted for the event "%s"', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear admin,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('a user deleted their registration to the event "%s".'), sanitize_text_field($event->name)) . '</p>';

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  /**
   * Notify the admin when new seats become available and a user is moved from the waiting list to confirmed list.
   * @param WPOE_Event $event
   * @param int[] $registrations
   * @return void
   */
  public static function send_registrations_picked_from_waiting_list_to_admin(WPOE_Event $event, array $registrations)
  {
    /* translators: %s is replaced with the name of the event */
    $subject = sprintf(__('Registrations picked from the waiting list of event "%s"', 'wp-open-events'), sanitize_text_field($event->name));
    $body = '<p>' . __('Dear admin,') . '<br/>'
      /* translators: %s is replaced with the name of the event */
      . sprintf(__('the following registration identifiers for the event "%s" were moved from waiting list to confirmed:'), sanitize_text_field($event->name))
      . ' ' . implode(', ', $registrations)
      . '</p>';

    $headers = WPOE_Mail_Sender::get_headers();
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  private static function get_registration_fields_content(WPOE_Event $event, array $values): string
  {
    $content = '<ul>';
    foreach ($values as $field_id => $value) {
      $label = null;
      $type = null;
      foreach ($event->formFields as $field) {
        if ($field->id === $field_id) {
          $label = $field->label;
          $type = $field->fieldType;
          break;
        }
      }
      if ($label === null) {
        error_log('Label not found for field id ' . $field_id);
        continue;
      }
      $content .= '<li><strong>' . sanitize_text_field($label) . '</strong>: '
        . WPOE_Mail_Sender::get_registration_value($type, $value) . '</li>';
    }
    $content .= '</ul>';
    return $content;
  }

  private static function get_registration_value(string $type, mixed $value)
  {
    if ($type === 'checkbox') {
      if ((int) $value === 1) {
        return __('Yes', 'wp-open-events');
      } else {
        return __('No', 'wp-open-events');
      }
    }
    if ($type === 'privacy') {
      return __('Accepted', 'wp-open-events');
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

  private static function get_registration_link_content(WPOE_Event $event, string $registration_token): string
  {
    $content = '';
    if ($event->editableRegistrations && count($event->posts) > 0) {
      $content .= '<p>' . __('You can modify or delete your registration by clicking on the following link:') . '</p>'
        . '<p><a href="' . $event->posts[0]->permalink . '#registration=' . $registration_token . '">' .
        $event->posts[0]->title
        . '</a></p>';
    }
    return $content;
  }

  private static function get_extra_content(WPOE_Event $event): string
  {
    if ($event->extraEmailContent !== null) {
      return $event->extraEmailContent;
    }
    return '';
  }
}
