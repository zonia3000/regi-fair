<?php

if (!defined('ABSPATH')) {
  exit;
}

require_once (WPOE_PLUGIN_DIR . 'classes/db.php');

class WPOE_DAO_Templates
{
  public function __construct()
  {
    global $wpdb;
    // Errors are explicitly checked and converted to exceptions in order to preserve API JSON output
    // (otherwise <div id="error"> could be printed at the beginning of the response payload)
    $wpdb->hide_errors();
  }

  public function list_event_templates(): array
  {
    global $wpdb;

    $query = $wpdb->prepare("SELECT t.id, t.name 
                FROM " . WPOE_DB::get_table_name('event_template') . " t ORDER BY t.id");

    $results = $wpdb->get_results($query, ARRAY_A);

    if ($wpdb->last_error) {
      throw new Exception($wpdb->last_error);
    }

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
                f.id AS field_id, f.label, f.type, f.description, f.required, f.extra, f.position
                FROM " . WPOE_DB::get_table_name('event_template') . " t
                LEFT JOIN " . WPOE_DB::get_table_name('event_template_form_field') . " f ON f.template_id = t.id
                WHERE t.id = %d ORDER BY f.position", $event_template_id);

    $results = $wpdb->get_results($query, ARRAY_A);

    if ($wpdb->last_error) {
      throw new Exception($wpdb->last_error);
    }

    if (count($results) === 0) {
      return null;
    }

    $template = new EventTemplate();
    $template->id = (int) $results[0]['id'];
    $template->name = $results[0]['name'];
    $template->autoremove = (bool) $results[0]['autoremove_submissions'];
    $template->autoremovePeriod = $results[0]['autoremove_submissions_period'];
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

    $wpdb->query('START TRANSACTION');

    // Insert the template
    $wpdb->insert(
      WPOE_DB::get_table_name('event_template'),
      [
        'name' => $event_template->name,
        'autoremove_submissions' => $event_template->autoremove,
        'autoremove_submissions_period' => $event_template->autoremovePeriod,
        'waiting_list' => $event_template->waitingList,
      ],
      ['%s', '%s', '%d', '%d']
    );

    // Get the ID of the inserted template
    $event_template_id = $wpdb->insert_id;

    // Insert the form fields
    foreach ($event_template->formFields as $form_field) {
      $wpdb->insert(
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
    }

    if ($wpdb->last_error) {
      $wpdb->query('ROLLBACK');
      throw new Exception($wpdb->last_error);
    } else {
      $wpdb->query('COMMIT');
    }

    return $event_template_id;
  }

  public function update_event_template(EventTemplate $event_template): bool
  {
    global $wpdb;

    $wpdb->query('START TRANSACTION');

    // Update the template
    $updated_rows = $wpdb->update(
      WPOE_DB::get_table_name('event_template'),
      [
        'name' => $event_template->name,
        'autoremove_submissions' => $event_template->autoremove,
        'autoremove_submissions_period' => $event_template->autoremovePeriod,
        'waiting_list' => $event_template->waitingList
      ],
      ['id' => $event_template->id],
      ['%s', '%s', '%d', '%d'],
      ['%d']
    );

    if ($updated_rows !== false) {
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
        $wpdb->query($query);
      } else {
        // Delete all old form fields
        $wpdb->delete(
          WPOE_DB::get_table_name('event_template_form_field'),
          ['template_id' => $event_template->id],
          ['%d']
        );
      }

      // Insert the updated form fields
      foreach ($event_template->formFields as $form_field) {
        if ($form_field->id === null) {
          $wpdb->insert(
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
        } else {
          $wpdb->update(
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
        }
      }
    }

    if ($wpdb->last_error) {
      $wpdb->query('ROLLBACK');
      throw new Exception($wpdb->last_error);
    } else {
      $wpdb->query('COMMIT');
    }

    return $updated_rows !== false;
  }

  public function delete_event_template(int $event_template_id): void
  {
    global $wpdb;

    $wpdb->query('START TRANSACTION');

    $wpdb->delete(WPOE_DB::get_table_name('event_template_form_field'), ['template_id' => $event_template_id], ['%d']);
    $wpdb->delete(WPOE_DB::get_table_name('event_template'), ['id' => $event_template_id], ['%d']);

    if ($wpdb->last_error) {
      $wpdb->query('ROLLBACK');
      throw new Exception($wpdb->last_error);
    } else {
      $wpdb->query('COMMIT');
    }
  }
}
