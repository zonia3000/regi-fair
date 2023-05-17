<?php

class PublicEventData
{
    public $id;
    public $name;
    public $date;
    public $formFields = [];
}

class Event extends PublicEventData
{
    public $autoremove = true;
    public $autoremovePeriod = 30;
}
