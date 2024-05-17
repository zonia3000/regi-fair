<?php

class WPOE_Form_Field
{
    /**
     * @var int|null
     */
    public $id;

    /**
     * @var string
     */
    public $label;

    /**
     * @var string
     */
    public $fieldType;

    /**
     * @var bool
     */
    public $required;

    /**
     * @var string
     */
    public $description;

    /**
     * @var object|null
     */
    public $extra;

    public $validators = [];

    /**
     * @var int
     */
    public $position;
}