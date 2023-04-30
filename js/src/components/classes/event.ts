type EventConfiguration = {

    name: string,
    date: string,
    participants?: number,
    formFields: Field[],
    autoremove: boolean,
    autoremovePeriod: number
};