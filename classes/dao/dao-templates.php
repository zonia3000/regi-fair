<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once (WPOE_PLUGIN_DIR . 'classes/db.php');

class WPOE_DAO_Templates extends WPOE_Base_DAO
{
  public function __construct()
  {
    parent::__construct();
  }

  public function list_event_templates(): array
  {
    global $wpdb;

    $query = $wpdb->prepare("SELECT t.id, t.name 
                FROM " . WPOE_DB::get_table_name('event_template') . " t ORDER BY t.id");

    $results = $wpdb->get_results($query, ARRAY_A);
    $this->check_results('retrieving the list of event templates');

    $events = [];
    foreach ($results as $result) {
      $events[] = [
        'id' => (int) $result['id'],
        'name' => $result['name']
      ];
    }
    return $events;
  }

  public function get_event_template(int $event_template_id): ?EventTemplate
  {
    global $wpdb;

    $query = $wpdb->prepare("SELECT t.id, t.name, t.autoremove_submissions, t.autoremove_submissions_period,
                t.editable_registrations, t.admin_email, t.extra_email_content,
                f.id AS field_id, f.label, f.type, f.description, f.required, f.extra, f.position
                FROM " . WPOE_DB::get_table_name('event_template') . " t
                LEFT JOIN " . WPOE_DB::get_table_name('event_template_form_field') . " f ON f.template_id = t.id
                WHERE t.id = %d ORDER BY f.position", $event_template_id);

    $results = $wpdb->get_results($query, ARRAY_A);
    $this->check_results('retrieving the event template');

    if (count($results) === 0) {
      return null;
    }

    $template = new EventTemplate();
    $template->id = (int) $results[0]['id'];
    $template->name = $results[0]['name'];
    $template->autoremove = (bool) $results[0]['autoremove_submissions'];
    $template->autoremovePeriod = $results[0]['autoremove_submissions_period'];
    $template->editableRegistrations = (bool) $results[0]['editable_registrations'];
    $template->adminEmail = $results[0]['admin_email'];
    $template->extraEmailContent = $results[0]['extra_email_content'];
    $template->formFields = $this->load_form_fields($results);

    return $template;
  }

  private function load_form_fields(array $results)
  {
    $formFields = [];
    foreach ($results as $result) {
      if ($result['field_id'] !== null) {
        $field = new FormField();
        $field->id = (int) $result['field_id'];
        $field->label = $result['label'];
        $field->fieldType = $result['type'];
        $field->description = $result['description'];
        $field->required = (bool) $result['required'];
        $field->extra = isset($result['extra']) ? json_decode($result['extra']) : null;
        $field->position = (int) $result['position'];
        $formFields[] = $field;
      }
    }
    return $formFields;
  }

  public function create_event_template(EventTemplate $event_template): int
  {
    global $wpdb;

    try {
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      // Insert the template
      $result = $wpdb->insert(
        WPOE_DB::get_table_name('event_template'),
        [
          'name' => $event_template->name,
          'autoremove_submissions' => $event_template->autoremove,
          'autoremove_submissions_period' => $event_template->autoremovePeriod,
          'waiting_list' => $event_template->waitingList,
          'editable_registrations' => $event_template->editableRegistrations,
          'admin_email' => $event_template->adminEmail,
          'extra_email_content' => $event_template->extraEmailContent
        ],
        ['%s', '%s', '%d', '%d', '%d', '%s', '%s']
      );
      $this->check_result($result, 'inserting event template');

      // Get the ID of the inserted template
      $event_template_id = $wpdb->insert_id;

      // Insert the form fields
      foreach ($event_template->formFields as $form_field) {
        $result = $wpdb->insert(
          WPOE_DB::get_table_name('event_template_form_field'),
          [
            'template_id' => $event_template_id,
            'label' => $form_field->label,
            'type' => $form_field->fieldType,
            'description' => $form_field->description,
            'required' => $form_field->required,
            'extra' => $form_field->extra === null ? null : json_encode($form_field->extra),
            'position' => $form_field->position
          ],
          ['%d', '%s', '%s', '%s', '%d', '%s', '%d']
        );
        $this->check_result($result, 'inserting event template form field');
      }
    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'creating event template');

    return $event_template_id;
  }

  public function update_event_template(EventTemplate $event_template): void
  {
    global $wpdb;

    try {
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      // Update the template
      $result = $wpdb->update(
        WPOE_DB::get_table_name('event_template'),
        [
          'name' => $event_template->name,
          'autoremove_submissions' => $event_template->autoremove,
          'autoremove_submissions_period' => $event_template->autoremovePeriod,
          'waiting_list' => $event_template->waitingList,
          'editable_registrations' => $event_template->editableRegistrations,
          'admin_email' => $event_template->adminEmail,
          'extra_email_content' => $event_template->extraEmailContent
        ],
        ['id' => $event_template->id],
        ['%s', '%s', '%d', '%d', '%d', '%s', '%s'],
        ['%d']
      );
      $this->check_result($result, 'updating event template');

      $current_field_ids = [];
      foreach ($event_template->formFields as $form_field) {
        if ($form_field->id !== null) {
          $current_field_ids[] = $form_field->id;
        }
      }

      if (count($current_field_ids) > 0) {
        // Delete form fields whose ids are not present anymore
        $placeholders = array_fill(0, count($current_field_ids), '%d');
        $query = $wpdb->prepare('DELETE FROM '
          . WPOE_DB::get_table_name('event_template_form_field')
          . ' WHERE id NOT IN (' . join(',', $placeholders) . ')', $current_field_ids);
        $result = $wpdb->query($query);
      } else {
        // Delete all old form fields
        $result = $wpdb->delete(
          WPOE_DB::get_table_name('event_template_form_field'),
          ['template_id' => $event_template->id],
          ['%d']
        );
      }
      $this->check_result($result, 'deleting event template form fields');

      // Insert the updated form fields
      foreach ($event_template->formFields as $form_field) {
        if ($form_field->id === null) {
          $result = $wpdb->insert(
            WPOE_DB::get_table_name('event_template_form_field'),
            [
              'template_id' => $event_template->id,
              'label' => $form_field->label,
              'type' => $form_field->fieldType,
              'description' => $form_field->description,
              'required' => $form_field->required,
              'extra' => $form_field->extra === null ? null : json_encode($form_field->extra),
              'position' => $form_field->position
            ],
            ['%d', '%s', '%s', '%s', '%d', '%s', '%d'],
          );
          $this->check_result($result, 'inserting new event template form field');
        } else {
          $result = $wpdb->update(
            WPOE_DB::get_table_name('event_template_form_field'),
            [
              'template_id' => $event_template->id,
              'label' => $form_field->label,
              'type' => $form_field->fieldType,
              'description' => $form_field->description,
              'required' => $form_field->required,
              'extra' => $form_field->extra === null ? null : json_encode($form_field->extra),
              'position' => $form_field->position
            ],
            ['id' => $form_field->id],
            ['%d', '%s', '%s', '%s', '%d', '%s', '%d'],
            ['%d']
          );
          $this->check_result($result, 'updating event template form field');
        }
      }
    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'updating event template');
  }

  public function delete_event_template(int $event_template_id): void
  {
    global $wpdb;

    try {
      $result = $wpdb->query('START TRANSACTION');
      $this->check_result($result, 'starting transaction');

      $result = $wpdb->delete(WPOE_DB::get_table_name('event_template_form_field'), ['template_id' => $event_template_id], ['%d']);
      $this->check_result($result, 'deleting event template form fields');

      $result = $wpdb->delete(WPOE_DB::get_table_name('event_template'), ['id' => $event_template_id], ['%d']);
      $this->check_result($result, 'deleting event template');

    } catch (Exception $ex) {
      $wpdb->query('ROLLBACK');
      throw $ex;
    }

    $result = $wpdb->query('COMMIT');
    $this->check_result($result, 'deleting event template');
  }
}
