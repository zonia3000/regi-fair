<?php

if (!defined('ABSPATH')) {
  die();
}

class REGI_FAIR_Event_Template
{
  /**
   * @var int
   */
  public $id;

  /**
   * @var string
   */
  public $name;

  /**
   * @var REGI_FAIR_Form_Field[]
   */
  public $formFields = [];

  /**
   * @var bool
   */
  public $autoremove = true;

  /**
   * @var int|null
   */
  public $autoremovePeriod;

  /**
   * @var bool
   */
  public $waitingList = false;

  /**
   * @var bool
   */
  public $editableRegistrations = true;

  /**
   * @var string|null
   */
  public $adminEmail;

  /**
   * @var string|null
   */
  public $extraEmailContent;
}