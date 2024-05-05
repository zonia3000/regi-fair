<?php

class EventTemplate
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
   * @var FormField[]
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