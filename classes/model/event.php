<?php

class PublicEventData
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
     * @var FormField[]
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
}

class PostReference
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

class Event extends PublicEventData
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
     * @var PostReference[]
     */
    public $posts;
}

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
}