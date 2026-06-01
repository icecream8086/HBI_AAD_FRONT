type CaseStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

interface Case {
  id: string
  petId: string
  doctorId: string
  diagnosis: string
  status: CaseStatus
  totalFee: number
  createdAt: string
}

interface CreateCaseDto {
  petId: string
  doctorId: string
  diagnosis: string
}

interface UpdateCaseDto {
  diagnosis?: string
  status?: CaseStatus
}
