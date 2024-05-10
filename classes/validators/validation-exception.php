<?php

class WPOE_Validation_Exception extends Exception
{
  public function __construct(string $message)
  {
    parent::__construct($message);
  }
}
