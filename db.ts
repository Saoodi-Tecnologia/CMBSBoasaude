import Database from 'better-sqlite3';

const db = new Database('medical_schedule.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    type TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    week_start_date TEXT NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ...
    room_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    shift TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    FOREIGN KEY(room_id) REFERENCES rooms(id),
    FOREIGN KEY(doctor_id) REFERENCES doctors(id)
  );
  
  CREATE TABLE IF NOT EXISTS disabled_days (
    week_start_date TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    PRIMARY KEY (week_start_date, day_of_week)
  );
`);

// Seed initial data based on the user's request/image
const seedData = () => {
  const doctorCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get() as { count: number };
  if (doctorCount.count === 0) {
    const insertDoctor = db.prepare('INSERT INTO doctors (id, name, specialty) VALUES (?, ?, ?)');
    insertDoctor.run('doc1', 'Dr. Silva', 'Cardiologia');
    insertDoctor.run('doc2', 'Dra. Santos', 'Ginecologia');
    insertDoctor.run('doc3', 'Dr. Oliveira', 'Ortopedia');
  }

  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get() as { count: number };
  if (roomCount.count === 0) {
    const insertRoom = db.prepare('INSERT INTO rooms (id, name, color, type) VALUES (?, ?, ?, ?)');
    // Gynecology/Obstetrics rooms (Pink/Reddish)
    insertRoom.run('room1', 'SALA 01', '#E91E8C', 'Gine/Obst');
    insertRoom.run('room14', 'SALA 14', '#F48FB1', 'Gine/Obst');
    insertRoom.run('room17', 'SALA 17', '#F8BBD9', 'Gine/Obst');
    
    // General rooms (Green)
    insertRoom.run('room2', 'SALA 02', '#1B5E20', 'General');
    insertRoom.run('room3', 'SALA 03', '#2E7D32', 'General');
    insertRoom.run('room4', 'SALA 04', '#388E3C', 'General');
    insertRoom.run('room5', 'SALA 05', '#43A047', 'General');
    insertRoom.run('room11', 'SALA 11', '#66BB6A', 'General');
    insertRoom.run('room13', 'SALA 13', '#81C784', 'General');
    insertRoom.run('room15', 'SALA 15', '#A5D6A7', 'General');
    insertRoom.run('room16', 'SALA 16', '#C8E6C9', 'General');
  }

  const scheduleCount = db.prepare('SELECT COUNT(*) as count FROM schedules').get() as { count: number };
  if (scheduleCount.count === 0) {
    const insertSchedule = db.prepare('INSERT INTO schedules (id, week_start_date, day_of_week, room_id, doctor_id, shift, time_slot) VALUES (?, ?, ?, ?, ?, ?, ?)');
    // Get IDs
    const doc1 = db.prepare("SELECT id FROM doctors WHERE name = 'Dr. Silva'").get() as {id: string};
    const doc2 = db.prepare("SELECT id FROM doctors WHERE name = 'Dra. Santos'").get() as {id: string};
    const room1 = db.prepare("SELECT id FROM rooms WHERE name = 'SALA 01'").get() as {id: string};
    const room2 = db.prepare("SELECT id FROM rooms WHERE name = 'SALA 02'").get() as {id: string};

    if (doc1 && doc2 && room1 && room2) {
        // Monday
        insertSchedule.run('sch1', '2026-03-02', 1, room1.id, doc2.id, 'MANHÃ', '07:00 - 13:00');
        insertSchedule.run('sch2', '2026-03-02', 1, room2.id, doc1.id, 'TARDE', '13:00 - 19:00');
        // Tuesday
        insertSchedule.run('sch3', '2026-03-02', 2, room1.id, doc2.id, 'MANHÃ', '07:00 - 13:00');
    }
  }
};

seedData();

export default db;
