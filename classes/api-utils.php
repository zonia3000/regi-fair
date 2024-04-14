<?php

function generic_server_error(Exception $exception)
{
  error_log($exception);
  return new WP_REST_Response(['error' => __('A critical error happened', 'wp-open-events')], 500);
}
