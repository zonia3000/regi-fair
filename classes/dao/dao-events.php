<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once (WPOE_PLUGIN_DIR . 'classes/db.php');

// Errors are explicitly checked and converted to exceptions in order to preserve API JSON output
// (otherwise <div id="error"> could be printed at the beginning of the response payload)
$wpdb->hide_errors();

class WPOE_DAO_Events
{
    public static function list_events(): array
    {
        global $wpdb;

        $query = $wpdb->prepare("SELECT e.id, e.name, e.date 
            FROM " . WPOE_DB::get_table_name('event') . " e ORDER BY e.date");

        $results = $wpdb->get_results($query, ARRAY_A);

        if ($wpdb->last_error) {
            throw new Exception($wpdb->last_error);
        }

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
            LEFT JOIN " . WPOE_DB::get_table_name('event_form_field') . " f ON f.event_id = e.id
            WHERE e.id = %d ORDER BY f.field_index", $event_id);

        $results = $wpdb->get_results($query, ARRAY_A);

        if ($wpdb->last_error) {
            throw new Exception($wpdb->last_error);
        }

        if (count($results) === 0) {
            return null;
        }

        $event = new Event();
        $event->id = (int) $results[0]['id'];
        $event->name = $results[0]['name'];
        $event->date = $results[0]['date'];
        $event->autoremove = (bool) $results[0]['autoremove_submissions'];
        $event->autoremovePeriod = $results[0]['autoremove_submissions_period'];
        $event->formFields = WPOE_DAO_Events::load_form_fields($results);

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

        if ($wpdb->last_error) {
            throw new Exception($wpdb->last_error);
        }

        if (count($results) === 0) {
            return null;
        }

        $event = new PublicEventData();
        $event->id = (int) $results[0]['id'];
        $event->name = $results[0]['name'];
        $event->date = $results[0]['date'];
        $event->formFields = WPOE_DAO_Events::load_form_fields($results);

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

        if ($wpdb->last_error) {
            $wpdb->query('ROLLBACK');
            throw new Exception($wpdb->last_error);
        } else {
            $wpdb->query('COMMIT');
        }

        return $event_id;
    }

    public static function delete_event(int $event_id): void
    {
        global $wpdb;

        $wpdb->query('START TRANSACTION');

        $wpdb->query($wpdb->prepare('DELETE FROM ' . WPOE_DB::get_table_name('event_registration_value') . ' rv JOIN '
            . WPOE_DB::get_table_name('event_registration') . ' r ON rv.registration_id = r.id WHERE r.event_id = %d', $event_id));

        $wpdb->delete(WPOE_DB::get_table_name('event_registration'), ['event_id' => $event_id], ['%d']);
        $wpdb->delete(WPOE_DB::get_table_name('event_form_field'), ['event_id' => $event_id], ['%d']);
        $wpdb->delete(WPOE_DB::get_table_name('event'), ['id' => $event_id], ['%d']);

        if ($wpdb->last_error) {
            $wpdb->query('ROLLBACK');
            throw new Exception($wpdb->last_error);
        } else {
            $wpdb->query('COMMIT');
        }
    }

    public static function register_to_event(int $event_id, ?string $registration_token, array $values): void
    {
        global $wpdb;

        $wpdb->query('START TRANSACTION');

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

        if ($wpdb->last_error) {
            $wpdb->query('ROLLBACK');
            throw new Exception($wpdb->last_error);
        } else {
            $wpdb->query('COMMIT');
        }
    }
}