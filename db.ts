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
    const newDoctors = [
      { id: '1', name: 'Ana Carolina Castro Nery', specialty: 'Ginecologia' },
      { id: '2', name: 'André Ricardo Rabelo Martins', specialty: 'Clínica Médica' },
      { id: '3', name: 'Apolo Cesar Rocha Xavier', specialty: 'Neurologia' },
      { id: '4', name: 'Camila Bulhões de Sousa Santa Inês', specialty: 'Ginecologia' },
      { id: '5', name: 'Clarissa Felix Almeida', specialty: 'Dermatologia' },
      { id: '6', name: 'Clarissa Pinto da Rocha Martinelli Pizarro', specialty: 'Clínica Médica' },
      { id: '7', name: 'Eliane Maria Gomes dos Santos', specialty: 'Cardiologia' },
      { id: '8', name: 'Ernane Machado Gomes', specialty: 'Obstetrícia' },
      { id: '9', name: 'Francine Mendonça Ribeiro', specialty: 'Endocrinologia Pediátrica' },
      { id: '10', name: 'Gabriel Costa Alves de Sousa', specialty: 'Reumatologia' },
      { id: '11', name: 'Gisella Pinto da Rocha Martinelli', specialty: 'Clínica Médica' },
      { id: '12', name: 'Indiara Maria Carneiro Lopes da Silva', specialty: 'Cardiologia' },
      { id: '13', name: 'Isadora Lins Dantas Almeida', specialty: 'Gastroenterologia' },
      { id: '14', name: 'Ivan Santana Batista Soares', specialty: 'Cardiologia' },
      { id: '15', name: 'José Sanmartin Amoedo', specialty: 'Ortopedia e Traumatologia' },
      { id: '16', name: 'Julia Lopes Boente', specialty: 'Otorrinolaringologia' },
      { id: '17', name: 'Juliana Carvalho de Oliveira', specialty: 'Infectologia' },
      { id: '18', name: 'Laura Miranda Santos Vieira', specialty: 'Gastroenterologia' },
      { id: '19', name: 'Letícia Menezes Pacheco', specialty: 'Clínica Médica' },
      { id: '20', name: 'Liz Azevedo', specialty: 'Neurologia' },
      { id: '21', name: 'Luanda Maria Sakaguchi Pinto', specialty: 'Mastologia' },
      { id: '22', name: 'Lucas Vergne Cheade Lins', specialty: 'Neurologia' },
      { id: '23', name: 'Luciara Maltez Ribeiro', specialty: 'Pediatria' },
      { id: '24', name: 'Luis Anselmo Cabral Vilas Boas', specialty: 'Cardiologia' },
      { id: '25', name: 'Luiza Noya Andrade Santos', specialty: 'Angiologia' },
      { id: '26', name: 'Luiza Noya Andrade Santos', specialty: 'Cirurgia Vascular' },
      { id: '27', name: 'Manoela Espinola de Andrade', specialty: 'Ginecologia' },
      { id: '28', name: 'Marinalva Oliveira Medina da Silva Filha', specialty: 'Mastologia' },
      { id: '29', name: 'Marta de Pinho Alcântara', specialty: 'Pediatria' },
      { id: '30', name: 'Mayala Moura Valença de Oliveira', specialty: 'Ginecologia' },
      { id: '31', name: 'Mônica Paixão de Queiroz', specialty: 'Clínica Médica' },
      { id: '32', name: 'Mônica Paixão de Queiroz', specialty: 'Dermatologia' },
      { id: '33', name: 'Nadson da Rocha Araújo', specialty: 'Gastroenterologia' },
      { id: '34', name: 'Octávia Maria de Souza Torres', specialty: 'Pediatria' },
      { id: '35', name: 'Pedro Ivo Valadão Casali Bahia', specialty: 'Angiologia' },
      { id: '36', name: 'Rafael Ferreira da Silva', specialty: 'Cardiologia' },
      { id: '37', name: 'Ronald Paulo Paes Landim', specialty: 'Ginecologia' },
      { id: '38', name: 'Ronna Vergnes Velloso', specialty: 'Endocrinologia' },
      { id: '39', name: 'Rosa Maria Mattos Gurgel Brandão', specialty: 'Endocrinologia' },
      { id: '40', name: 'Sandra Castello Branco Ledoux Cavalcanti', specialty: 'Cardiologia' },
      { id: '41', name: 'Tayna da Silva Domingos', specialty: 'Hepatologia' },
      { id: '42', name: 'Taísa Quécia da Silva Nogueira', specialty: 'Endocrinologia' },
      { id: '43', name: 'Thiago Almeida Gomes Moura', specialty: 'Endocrinologia' }
    ];
    newDoctors.forEach(d => insertDoctor.run(d.id, d.name, d.specialty));
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
    /* 
    const doc1 = db.prepare("SELECT id FROM doctors WHERE name = 'Antigo Dr. Silva'").get() as {id: string};
    const room1 = db.prepare("SELECT id FROM rooms WHERE name = 'SALA 01'").get() as {id: string};
    if (doc1 && room1) {
        // Exemplo de como adicionar semente se necessário
    }
    */
  }
};

seedData();

export default db;
