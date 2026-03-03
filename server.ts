import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { v4 as uuidv4 } from 'uuid';

async function startServer() {
  const { supabase } = await import('./supabase');
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes

  // Doctors
  app.get('/api/doctors', async (req, res) => {
    try {
      const { data, error } = await supabase.from('doctors').select('*');
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  app.post('/api/doctors', async (req, res) => {
    try {
      const { name, specialty } = req.body;
      const { data, error } = await supabase.from('doctors').insert([{ name, specialty }]).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error('Error creating doctor:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  app.put('/api/doctors/:id', async (req, res) => {
    try {
      const { name, specialty } = req.body;
      const { id } = req.params;
      const { data, error } = await supabase.from('doctors').update({ name, specialty }).eq('id', id).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error('Error updating doctor:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  app.delete('/api/doctors/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting doctor:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  // Rooms
  app.get('/api/rooms', async (req, res) => {
    try {
      const { data, error } = await supabase.from('rooms').select('*');
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  app.post('/api/rooms', async (req, res) => {
    try {
      const { name, type } = req.body;
      const { data, error } = await supabase.from('rooms').insert([{ name, type }]).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error('Error creating room:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  app.put('/api/rooms/:id', async (req, res) => {
    try {
      const { name, type } = req.body;
      const { id } = req.params;
      const { data, error } = await supabase.from('rooms').update({ name, type }).eq('id', id).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error('Error updating room:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  app.delete('/api/rooms/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting room:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  // Schedules
  app.get('/api/schedules', async (req, res) => {
    try {
      const { week_start_date } = req.query;
      if (!week_start_date) {
        return res.status(400).json({ error: 'week_start_date is required' });
      }

      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          id,
          week_start_date,
          day_of_week,
          shift,
          time_slot,
          room:rooms(name, type),
          doctor:doctors(name, specialty)
        `)
        .eq('week_start_date', week_start_date);

      if (scheduleError) throw scheduleError;

      const formattedSchedules = (schedules || []).map(s => {
        const room = (s as any).room || { name: 'Sala Removida', type: 'N/A' };
        const doctor = (s as any).doctor || { name: 'Médico Removido', specialty: 'N/A' };

        return {
          ...s,
          room_name: room.name,
          room_type: room.type,
          doctor_name: doctor.name,
          doctor_specialty: doctor.specialty
        };
      });

      const { data: disabledDaysData, error: disabledError } = await supabase
        .from('disabled_days')
        .select('day_of_week')
        .eq('week_start_date', week_start_date);

      if (disabledError) throw disabledError;

      res.json({
        schedules: formattedSchedules,
        disabledDays: (disabledDaysData || []).map(d => d.day_of_week)
      });
    } catch (err) {
      console.error('Error fetching schedules:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  app.post('/api/schedules', async (req, res) => {
    try {
      const { week_start_date, day_of_week, room_id, doctor_id, shift, time_slot } = req.body;

      const { data, error } = await supabase
        .from('schedules')
        .insert([{ week_start_date, day_of_week, room_id, doctor_id, shift, time_slot }])
        .select(`
          id,
          week_start_date,
          day_of_week,
          shift,
          time_slot,
          room:rooms(name, type),
          doctor:doctors(name, specialty)
        `)
        .single();

      if (error) throw error;

      const d = data as any;
      const formattedSchedule = {
        ...d,
        room_name: d.room.name,
        room_type: d.room.type,
        doctor_name: d.doctor.name,
        doctor_specialty: d.doctor.specialty
      };

      res.json(formattedSchedule);
    } catch (err) {
      console.error('Error creating schedule:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  app.delete('/api/schedules/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting schedule:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  // Clear entire week (called when navigating away from a week)
  app.delete('/api/week/:week_start_date', async (req, res) => {
    try {
      const { week_start_date } = req.params;

      const { error: scheduleError } = await supabase
        .from('schedules')
        .delete()
        .eq('week_start_date', week_start_date);
      if (scheduleError) throw scheduleError;

      const { error: disabledError } = await supabase
        .from('disabled_days')
        .delete()
        .eq('week_start_date', week_start_date);
      if (disabledError) throw disabledError;

      console.log(`Cleared all data for week: ${week_start_date}`);
      res.json({ success: true });
    } catch (err) {
      console.error('Error clearing week:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  // Disabled Days
  app.post('/api/disabled-days', async (req, res) => {
    try {
      const { week_start_date, day_of_week, disabled } = req.body;

      if (disabled) {
        const { error } = await supabase
          .from('disabled_days')
          .upsert({ week_start_date, day_of_week }, { onConflict: 'week_start_date,day_of_week' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('disabled_days')
          .delete()
          .eq('week_start_date', week_start_date)
          .eq('day_of_week', day_of_week);
        if (error) throw error;
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Error updating disabled day:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Connected to Supabase project: dxzdhuctkfunaozeugxv`);
  });
}

startServer();
