<?php

if (!defined('ABSPATH')) {
  die();
}

class REGI_FAIR_Registration
{
  /**
   * @var int|null
   */
  public $id;

  /**
   * @var array
   */
  public $values;

  /**
   * @var int|null
   */
  public $numberOfPeople;

  /**
   * @var bool
   */
  public $waitingList;

  /**
   * @var string|null
   */
  public $insertedAt;

  /**
   * @var string|null
   */
  public $updatedAt;
}
