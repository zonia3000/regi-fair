<?php

require_once (WPOE_PLUGIN_DIR . 'classes/db.php');

class WPOE_DAO
{
    public static function list_events(): array
    {
        global $wpdb;

        $query = $wpdb->prepare("SELECT e.id, e.name, e.date 
            FROM " . WPOE_DB::get_table_name('event') . " e ORDER BY e.date");

        $results = $wpdb->get_results($query, ARRAY_A);

        $events = [];
        foreach ($results as $result) {
            $events[] = [
                'id' => (int) $result['id'],
                'name' => $result['name'],
                'date' => $result['date']
            ];
        }
        return $events;
    }

    public static function get_event(int $event_id): ?Event
    {
        global $wpdb;

        $query = $wpdb->prepare("SELECT e.id, e.name, e.date, e.autoremove_submissions, e.autoremove_submissions_period,
            f.id AS field_id, f.label, f.type, f.description, f.required, f.extra, f.field_index
            FROM " . WPOE_DB::get_table_name('event') . " e
            JOIN " . WPOE_DB::get_table_name('event_form_field') . " f ON f.event_id = e.id
            WHERE e.id = %d ORDER BY f.field_index", $event_id);

        $results = $wpdb->get_results($query, ARRAY_A);

        if (count($results) === 0) {
            return null;
        }

        $event = new Event();
        $event->id = (int) $results[0]['id'];
        $event->name = $results[0]['name'];
        $event->date = $results[0]['date'];
        $event->autoremove = (bool) $results[0]['autoremove_submissions'];
        $event->autoremovePeriod = $results[0]['autoremove_submissions_period'];
        $event->formFields = WPOE_DAO::load_form_fields($results);

        return $event;
    }

    public static function get_public_event_data(int $event_id): ?PublicEventData
    {
        global $wpdb;

        $query = $wpdb->prepare("SELECT e.id, e.name,
            f.id AS field_id, f.label, f.type, f.description, f.required, f.extra, f.field_index
            FROM " . WPOE_DB::get_table_name('event') . " e
            LEFT JOIN " . WPOE_DB::get_table_name('event_form_field') . " f ON f.event_id = e.id
            WHERE e.id = %d ORDER BY f.field_index", $event_id);

        $results = $wpdb->get_results($query, ARRAY_A);

        if (count($results) === 0) {
            return null;
        }

        $event = new PublicEventData();
        $event->id = (int) $results[0]['id'];
        $event->name = $results[0]['name'];
        $event->date = $results[0]['date'];
        $event->formFields = WPOE_DAO::load_form_fields($results);

        return $event;
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

    public static function create_event(Event $event): int
    {
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        try {
            // Insert the event
            $wpdb->insert(
                WPOE_DB::get_table_name('event'),
                [
                    'name' => $event->name,
                    'date' => $event->date,
                    'autoremove_submissions' => $event->autoremove,
                    'autoremove_submissions_period' => $event->autoremovePeriod,
                    'max_participants' => $event->maxParticipants,
                    'waiting_list' => $event->waitingList,
                ],
                ['%s', '%s', '%d', '%d']
            );

            // Get the ID of the inserted event
            $event_id = $wpdb->insert_id;

            // Insert the form fields
            $i = 0;
            foreach ($event->formFields as $form_field) {
                $wpdb->insert(
                    WPOE_DB::get_table_name('event_form_field'),
                    [
                        'event_id' => $event_id,
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

            $wpdb->query('COMMIT');

            return $event_id;
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            die ('Error inserting event');
        }
    }

    public static function list_event_templates(): array
    {
        global $wpdb;

        $query = $wpdb->prepare("SELECT t.id, t.name 
            FROM " . WPOE_DB::get_table_name('event_template') . " t ORDER BY t.id");

        $results = $wpdb->get_results($query, ARRAY_A);

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

        if (count($results) === 0) {
            return null;
        }

        $template = new EventTemplate();
        $template->id = (int) $results[0]['id'];
        $template->name = $results[0]['name'];
        $template->autoremove = (bool) $results[0]['autoremove_submissions'];
        $template->autoremovePeriod = $results[0]['autoremove_submissions_period'];
        $template->formFields = WPOE_DAO::load_form_fields($results);

        return $template;
    }

    public static function create_event_template(EventTemplate $event_template): int
    {
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        try {
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

            $wpdb->query('COMMIT');

            return $event_template_id;
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            die ('Error inserting event template');
        }
    }

    public static function delete_event_template(int $event_template_id): void
    {
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        try {
            $wpdb->delete(WPOE_DB::get_table_name('event_template_form_field'), ['template_id' => $event_template_id], ['%d']);
            $wpdb->delete(WPOE_DB::get_table_name('event_template'), ['id' => $event_template_id], ['%d']);

            $wpdb->query('COMMIT');
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            die ('Error deleting event template');
        }
    }

    public static function register_to_event(int $event_id, ?string $registration_token, array $values): ?int
    {
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        try {
            $wpdb->insert(
                WPOE_DB::get_table_name('event_registration'),
                [
                    'event_id' => $event_id,
                    'registration_token' => $registration_token,
                ],
                ['%d', '%s', '%s']
            );

            $registration_id = $wpdb->insert_id;

            foreach ($values as $key => $value) {
                $wpdb->insert(
                    WPOE_DB::get_table_name('event_registration_value'),
                    [
                        'registration_id' => $registration_id,
                        'field_key' => $key,
                        'field_value' => $value,
                    ],
                    ['%d', '%s', '%s']
                );
            }

            $wpdb->query('COMMIT');

            return null;
        } catch (Exception $e) {
            $wpdb->query('ROLLBACK');
            die ('Error inserting submission');
        }
    }
}