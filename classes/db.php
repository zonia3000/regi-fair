<?php

define('REGI_FAIR_TABLE_PREFIX', 'regi_fair_');

class REGI_FAIR_DB
{
  public static function get_table_name(string $table_name): string
  {
    global $wpdb;
    return $wpdb->prefix . REGI_FAIR_TABLE_PREFIX . $table_name;
  }
}