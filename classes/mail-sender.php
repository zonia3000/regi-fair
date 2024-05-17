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
      . '<p>' . __('You inserted the following data:') . '</p><ul>';

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
      $body .= "<li><strong>$label</strong>: " . sanitize_text_field($value) . "</li>";
    }
    $body .= '</ul>';

    if (count($event->posts) > 0) {
      $body .= '<p>' . __('You can modify or delete your registration by clicking on the following link:') . '</p>'
        . '<p><a href="' . $event->posts[0]->permalink . '#registration=' . $registration_token . '">' .
        $event->posts[0]->title
        . '</a></p>';
    }

    $headers = array('Content-Type: text/html; charset=UTF-8');

    wp_mail($to, $subject, $body, $headers);
  }

  public static function send_new_registration_to_admin(WPOE_Event $event, array $values)
  {
    $subject = sprintf(__('New registration for the event "%s"', 'wp-open-events'), $event->name);
    $body = '<p>' . __('Dear admin,') . '<br/>'
      . sprintf(__('a new registration to the event "%s" has been added.'), $event->name) . '</p>'
      . '<p>' . __('The user inserted the following data:') . '</p><ul>';

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
      $body .= "<li><strong>$label</strong>: " . sanitize_text_field($value) . "</li>";
    }
    $body .= '</ul>';

    $headers = array('Content-Type: text/html; charset=UTF-8');

    wp_mail($event->adminEmail, $subject, $body, $headers);
  }
}
