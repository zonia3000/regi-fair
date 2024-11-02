<?php

class REGI_FAIR_Public_Event_Data
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
   * @var string
   */
  public $date;

  /**
   * @var REGI_FAIR_Form_Field[]
   */
  public $formFields = [];

  /**
   * @var bool
   */
  public $waitingList = false;

  /**
   * @var int|null
   */
  public $availableSeats;

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

  /**
   * True if the event date is in the past.
   * @var bool
   */
  public $ended;
}

class REGI_FAIR_Post_Reference
{
  /**
   * @var string
   */
  public $title;

  /**
   * @var string
   */
  public $permalink;
}

class REGI_FAIR_Event extends REGI_FAIR_Public_Event_Data
{
  /**
   * @var bool
   */
  public $autoremove = true;

  /**
   * @var int|null
   */
  public $autoremovePeriod;

  /**
   * @var int|null
   */
  public $maxParticipants;

  /**
   * @var bool
   */
  public $hasResponses = false;

  /**
   * @var REGI_FAIR_Post_Reference[]
   */
  public $posts;
}
