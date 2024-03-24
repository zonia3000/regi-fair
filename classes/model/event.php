<?php

class PublicEventData
{
    public $id;
    public $name;
    public $date;
    public $formFields = [];
    public $waitingList = false;
    public $availableSeats;
}

class Event extends PublicEventData
{
    public $autoremove = true;
    public $autoremovePeriod = 30;
    public $maxParticipants;
}

class EventTemplate
{
    public $id;
    public $name;
    public $formFields = [];
    public $autoremove = true;
    public $autoremovePeriod = 30;
    public $waitingList = false;
}