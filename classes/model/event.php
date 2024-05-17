<?php

class WPOE_Public_Event_Data
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
     * @var WPOE_Form_Field[]
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
}

class WPOE_Post_Reference
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

class WPOE_Event extends WPOE_Public_Event_Data
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
     * @var WPOE_Post_Reference[]
     */
    public $posts;
}
