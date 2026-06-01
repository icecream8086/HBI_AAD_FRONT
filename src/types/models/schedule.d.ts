type ScheduleStatus = 'available' | 'booked' | 'unavailable'

interface Schedule {
  id: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  maxPatients: number
  currentPatients: number
  status: ScheduleStatus
}

interface CreateScheduleDto {
  doctorId: string
  date: string
  startTime: string
  endTime: string
  maxPatients: number
}
