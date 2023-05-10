type FieldType = 'text' | 'email' | 'radio'

type Field = {
    label: string,
    fieldType: FieldType,
    required: boolean,
    description: string
}

type RadioField = Field & {
    fieldType: 'radio',
    options: string[]
}
