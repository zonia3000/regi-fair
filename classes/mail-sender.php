<?php

class WPOE_Mail_Sender
{
  /**
   * @param string|string[] $to
   */
  public static function send_registration_confirmation(WPOE_Event $event, $to, string $registration_token, array $values)
  {
    $subject = sprintf(__('Registration to the event "%s" is confirmed', 'wp-open-events'), $event->name);
    $body = '<p>' . __('Dear user,') . '<br/>'
      . sprintf(__('your registration to the event "%s" is confirmed.'), $event->name) . '</p>'
      . '<p>' . __('You inserted the following data:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= WPOE_Mail_Sender::get_registration_link_content($event, $registration_token);

    $headers = array('Content-Type: text/html; charset=UTF-8');
    wp_mail($to, $subject, $body, $headers);
  }

  public static function send_new_registration_to_admin(WPOE_Event $event, array $values)
  {
    $subject = sprintf(__('New registration for the event "%s"', 'wp-open-events'), $event->name);
    $body = '<p>' . __('Dear admin,') . '<br/>'
      . sprintf(__('a new registration to the event "%s" has been added.'), $event->name) . '</p>'
      . '<p>' . __('The user inserted the following data:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);

    $headers = array('Content-Type: text/html; charset=UTF-8');
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_registration_updated_confirmation(WPOE_Event $event, $to, string $registration_token, array $values)
  {
    $subject = sprintf(__('Registration to the event "%s" has been updated', 'wp-open-events'), $event->name);
    $body = '<p>' . __('Dear user,') . '<br/>'
      . sprintf(__('your registration to the event "%s" has been updated.'), $event->name) . '</p>'
      . '<p>' . __('You inserted the following data:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);
    $body .= WPOE_Mail_Sender::get_registration_link_content($event, $registration_token);

    $headers = array('Content-Type: text/html; charset=UTF-8');
    wp_mail($to, $subject, $body, $headers);
  }

  public static function send_registration_updated_to_admin(WPOE_Event $event, array $values)
  {
    $subject = sprintf(__('Registration updated for the event "%s"', 'wp-open-events'), $event->name);
    $body = '<p>' . __('Dear admin,') . '<br/>'
      . sprintf(__('a registration to the event "%s" has been updated.'), $event->name) . '</p>'
      . '<p>' . __('The user inserted the following data:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);

    $headers = array('Content-Type: text/html; charset=UTF-8');
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  public static function send_registration_updated_by_admin(WPOE_Event $event, $to, array $values)
  {
    $subject = sprintf(__('Registration to the event "%s" has been updated', 'wp-open-events'), $event->name);
    $body = '<p>' . __('Dear user,') . '<br/>'
      . sprintf(__('your registration to the event "%s" has been updated by an administrator.'), $event->name) . '</p>'
      . '<p>' . __('The updated data is:') . '</p>';

    $body .= WPOE_Mail_Sender::get_registration_fields_content($event, $values);

    $headers = array('Content-Type: text/html; charset=UTF-8');
    wp_mail($to, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_registration_deleted_confirmation(WPOE_Event $event, $to)
  {
    $subject = sprintf(__('Registration to the event "%s" has been deleted', 'wp-open-events'), $event->name);
    $body = '<p>' . __('Dear user,') . '<br/>'
      . sprintf(__('your registration to the event "%s" has been deleted.'), $event->name) . '</p>';

    $headers = array('Content-Type: text/html; charset=UTF-8');
    wp_mail($to, $subject, $body, $headers);
  }

  /**
   * @param string|string[] $to
   */
  public static function send_registration_deleted_by_admin(WPOE_Event $event, $to)
  {
    $subject = sprintf(__('Registration to the event "%s" has been deleted', 'wp-open-events'), $event->name);
    $body = '<p>' . __('Dear user,') . '<br/>'
      . sprintf(__('your registration to the event "%s" has been deleted by an administrator.'), $event->name) . '</p>';

    $headers = array('Content-Type: text/html; charset=UTF-8');
    wp_mail($to, $subject, $body, $headers);
  }

  public static function send_registration_deleted_to_admin(WPOE_Event $event)
  {
    $subject = sprintf(__('Registration deleted for the event "%s"', 'wp-open-events'), $event->name);
    $body = '<p>' . __('Dear admin,') . '<br/>'
      . sprintf(__('a user deleted their registration to the event "%s".'), $event->name) . '</p>';

    $headers = array('Content-Type: text/html; charset=UTF-8');
    wp_mail($event->adminEmail, $subject, $body, $headers);
  }

  private static function get_registration_fields_content(WPOE_Event $event, array $values): string
  {
    $content = '<ul>';
    foreach ($values as $field_id => $value) {
      $label = null;
      foreach ($event->formFields as $field) {
        if ($field->id === $field_id) {
          $label = $field->label;
          break;
        }
      }
      if ($label === null) {
        error_log('Label not found for field id ' . $field_id);
        continue;
      }
      $content .= "<li><strong>$label</strong>: " . sanitize_text_field($value) . "</li>";
    }
    $content .= '</ul>';
    return $content;
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
}
