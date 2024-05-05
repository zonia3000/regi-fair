type FieldType = 'text' | 'email' | 'radio'

type Field = {
    id?: number
    label: string
    fieldType: FieldType
    required: boolean
    description: string
    extra?: object
    validate: () => boolean
}

type RadioField = Field & {
    fieldType: 'radio'
    extra: {
        options: string[]
    }
}
