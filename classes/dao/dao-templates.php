<?php

require_once (WPOE_PLUGIN_DIR . 'classes/db.php');

// Errors are explicitly checked and converted to exceptions in order to preserve API JSON output
// (otherwise <div id="error"> could be printed at the beginning of the response payload)
$wpdb->hide_errors();

class WPOE_DAO_Templates
{
  public static function list_event_templates(): array
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

  public static function get_event_template(int $event_template_id): ?EventTemplate
  {
    global $wpdb;

    $query = $wpdb->prepare("SELECT t.id, t.name, t.autoremove_submissions, t.autoremove_submissions_period,
                f.id AS field_id, f.label, f.type, f.description, f.required, f.extra, f.field_index
                FROM " . WPOE_DB::get_table_name('event_template') . " t
                LEFT JOIN " . WPOE_DB::get_table_name('event_template_form_field') . " f ON f.template_id = t.id
                WHERE t.id = %d ORDER BY f.field_index", $event_template_id);

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
    $template->formFields = WPOE_DAO_Templates::load_form_fields($results);

    return $template;
  }

  private static function load_form_fields(array $results)
  {
    $formFields = [];
    foreach ($results as $result) {
      if ($result['field_id'] !== null) {
        $field = new FormField();
        $field->id = $result['field_id'];
        $field->label = $result['label'];
        $field->fieldType = $result['type'];
        $field->description = $result['description'];
        $field->required = (bool) $result['required'];
        $field->extra = $result['extra'];
        $field->order = (int) $result['field_index'];
        $formFields[] = $field;
      }
    }
    return $formFields;
  }

  public static function create_event_template(EventTemplate $event_template): int
  {
    global $wpdb;

    $wpdb->query('START TRANSACTION');

    // Insert the event
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
    $i = 0;
    foreach ($event_template->formFields as $form_field) {
      $wpdb->insert(
        WPOE_DB::get_table_name('event_template_form_field'),
        [
          'template_id' => $event_template_id,
          'label' => $form_field['label'],
          'type' => $form_field['fieldType'],
          'description' => $form_field['description'],
          'required' => $form_field['required'],
          'extra' => $form_field['extra'],
          'field_index' => $i
        ],
        ['%d', '%s', '%s', '%d', '%s']
      );
      $i++;
    }

    if ($wpdb->last_error) {
      $wpdb->query('ROLLBACK');
      throw new Exception($wpdb->last_error);
    } else {
      $wpdb->query('COMMIT');
    }

    return $event_template_id;
  }

  public static function delete_event_template(int $event_template_id): void
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
