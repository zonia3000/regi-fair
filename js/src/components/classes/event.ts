type EventConfiguration = {

    id: number | null
    name: string
    date: string
    registrations?: number
    postTitle?: string | null
    postPermalink?: string | null
    hasMultipleReferences?: boolean
    formFields: Field[]
    autoremove: boolean
    autoremovePeriod: number
    maxParticipants: number | null
    availableSeats?: number,
    waitingList: boolean
    hasResponses?: boolean
    adminEmail: string | null
    editableRegistrations: boolean
    extraEmailContent: string
};