type EventConfiguration = {

    id: number | null
    name: string
    date: string
    participants?: number
    formFields: Field[]
    autoremove: boolean
    autoremovePeriod: number
    maxParticipants: number | null
    waitingList: boolean
    hasResponses?: boolean
};