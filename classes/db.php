<?php

define('WPOE_TABLE_PREFIX', 'wpoe_');

class WPOE_DB
{
    public static function get_table_name(string $table_name): string
    {
        global $wpdb;
        return $wpdb->prefix . WPOE_TABLE_PREFIX . $table_name;
    }
}