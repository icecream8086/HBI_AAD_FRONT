interface Medicine {
  id: string
  name: string
  genericName: string
  specification: string
  manufacturer: string
  unit: string
  unitPrice: number
  stock: number
  createdAt: string
}

interface CreateMedicineDto {
  name: string
  genericName: string
  specification: string
  manufacturer: string
  unit: string
  unitPrice: number
}
