export type FieldType = 'text' | 'email' | 'number' | 'radio'

export type Field = {
    id?: number
    label: string
    fieldType: FieldType
    required: boolean
    description?: string
    extra?: object
    validate: () => boolean
}

export type RadioField = Field & {
    fieldType: 'radio'
    extra: {
        options: string[]
    }
}
