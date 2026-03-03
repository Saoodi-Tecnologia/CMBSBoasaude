export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export interface Room {
  id: string;
  name: string;
  color: string;
  type: 'Gine/Obst' | 'General';
}

export interface Schedule {
  id: string;
  week_start_date: string;
  day_of_week: number; // 0-6
  room_id: string;
  doctor_id: string;
  shift: string;
  time_slot: string;
  room_name?: string;
  room_color?: string;
  room_type?: string;
  doctor_name?: string;
  doctor_specialty?: string;
}

export interface WeekConfig {
  startDate: Date;
  disabledDays: number[];
}
