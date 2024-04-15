type FieldType = 'text' | 'email' | 'radio'

type Field = {
    label: string
    fieldType: FieldType
    required: boolean
    description: string
    validate: () => boolean
}

type RadioField = Field & {
    fieldType: 'radio'
    options: string[]
}
