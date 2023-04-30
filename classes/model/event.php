<?php

class Event
{
    public $id;
    public $name;
    public $date;
    public $autoremove = true;
    public $autoremovePeriod = 30;
    public $formFields = [];
}