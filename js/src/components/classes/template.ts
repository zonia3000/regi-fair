type TemplateConfiguration = {

  id: number | null
  name: string,
  formFields: Field[],
  autoremove: boolean,
  autoremovePeriod: number
  waitingList: boolean
};