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

  // ====== MONTHLY ALLOCATIONS ====== //

  app.get('/api/monthly-allocations', async (req, res) => {
    try {
      const { month, year } = req.query;
      if (!month || !year) return res.status(400).json({ error: 'month and year are required' });

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      const { data, error } = await supabase
        .from('monthly_allocations')
        .select(`
          id, date, shift,
          room_id, doctor_id,
          room:rooms(name, color, type),
          doctor:doctors(name, specialty)
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const formatted = (data || []).map((m: any) => ({
        ...m,
        room_name: m.room?.name,
        room_color: m.room?.color,
        room_type: m.room?.type,
        doctor_name: m.doctor?.name,
        doctor_specialty: m.doctor?.specialty
      }));
      res.json(formatted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/monthly-allocations', async (req, res) => {
    try {
      let { date, room_id, doctor_id, shift } = req.body;
      const isInterdiction = doctor_id === 'INTERDITADO';
      if (isInterdiction) {
        doctor_id = null;
      } else if (!doctor_id) {
        return res.status(400).json({ error: 'doctor_id is required' });
      }

      // Check for conflicts
      let conflictShifts = [];
      if (shift === 'MANHÃ/TARDE') conflictShifts = ['MANHÃ', 'TARDE', 'MANHÃ/TARDE'];
      else if (shift === 'MANHÃ') conflictShifts = ['MANHÃ', 'MANHÃ/TARDE'];
      else if (shift === 'TARDE') conflictShifts = ['TARDE', 'MANHÃ/TARDE'];
      else conflictShifts = [shift, 'MANHÃ/TARDE'];

      const { data: conflicts, error: conflictErr } = await supabase
        .from('monthly_allocations')
        .select('id')
        .eq('date', date)
        .eq('room_id', room_id)
        .in('shift', conflictShifts);

      if (conflictErr) throw conflictErr;
      if (conflicts && conflicts.length > 0) {
        return res.status(409).json({ error: 'Sala já ocupada' });
      }

      const { data, error } = await supabase
        .from('monthly_allocations')
        .insert([{ date, room_id, doctor_id, shift }])
        .select(`
          id, date, shift, room_id, doctor_id,
          room:rooms(name, color, type),
          doctor:doctors(name, specialty)
        `)
        .single();

      if (error) throw error;

      res.json({
        ...data,
        room_name: (data as any).room?.name,
        room_color: (data as any).room?.color,
        room_type: (data as any).room?.type,
        doctor_name: (data as any).doctor?.name,
        doctor_specialty: (data as any).doctor?.specialty
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/monthly-allocations/bulk', async (req, res) => {
    try {
      const { allocations } = req.body;
      if (!allocations || !allocations.length) return res.json({ success: true, count: 0 });

      let processed = 0;
      for (const item of allocations) {
        if (!item.doctor_id) continue;

        let conflictShifts = [];
        if (item.shift === 'MANHÃ/TARDE') conflictShifts = ['MANHÃ', 'TARDE', 'MANHÃ/TARDE'];
        else if (item.shift === 'MANHÃ') conflictShifts = ['MANHÃ', 'MANHÃ/TARDE'];
        else if (item.shift === 'TARDE') conflictShifts = ['TARDE', 'MANHÃ/TARDE'];
        else conflictShifts = [item.shift, 'MANHÃ/TARDE'];

        await supabase
          .from('monthly_allocations')
          .delete()
          .eq('date', item.date)
          .eq('room_id', item.room_id)
          .in('shift', conflictShifts);

        await supabase.from('monthly_allocations').insert([item]);
        processed++;
      }
      res.json({ success: true, count: processed });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/monthly-allocations/sync-from-weekly', async (req, res) => {
    try {
      const { month, year } = req.body;
      if (!month || !year) return res.status(400).json({ error: 'Required fields missing' });

      const getMonday = (d: Date) => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(12, 0, 0, 0);
        return monday.toISOString().split('T')[0];
      };

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const daysToProcess = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0) daysToProcess.push(new Date(d));
      }

      let addedCount = 0;
      for (const dateObj of daysToProcess) {
        const dateStr = dateObj.toISOString().split('T')[0];
        const weekStartDate = getMonday(new Date(dateObj));
        const dayOfWeek = dateObj.getDay();

        const { data: schedules } = await supabase
          .from('schedules')
          .select('*')
          .eq('week_start_date', weekStartDate)
          .eq('day_of_week', dayOfWeek);

        if (!schedules) continue;

        for (const sch of schedules) {
          if (!sch.doctor_id) continue;

          const { data: existing } = await supabase
            .from('monthly_allocations')
            .select('id')
            .eq('date', dateStr)
            .eq('room_id', sch.room_id)
            .eq('shift', sch.shift)
            .single();

          if (!existing) {
            await supabase.from('monthly_allocations').insert([{
              date: dateStr, room_id: sch.room_id, doctor_id: sch.doctor_id, shift: sch.shift
            }]);
            addedCount++;
          }
        }
      }
      res.json({ success: true, added: addedCount });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/api/monthly-allocations/clear', async (req, res) => {
    try {
      const { month, year } = req.body;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      const { error } = await supabase
        .from('monthly_allocations')
        .delete()
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/monthly-allocations/copy-month', async (req, res) => {
    try {
      const { fromMonth, fromYear, toMonth, toYear } = req.body;
      const fromStartDate = `${fromYear}-${String(fromMonth).padStart(2, '0')}-01`;
      const fromEndDate = `${fromYear}-${String(fromMonth).padStart(2, '0')}-31`;

      const { data: allocations, error: fetchErr } = await supabase
        .from('monthly_allocations')
        .select('*')
        .gte('date', fromStartDate)
        .lte('date', fromEndDate);

      if (fetchErr) throw fetchErr;
      if (!allocations || !allocations.length) return res.json({ success: true, copied: 0 });

      let copiedCount = 0;
      for (const alloc of allocations) {
        const sourceDate = new Date(alloc.date);
        const targetDate = new Date(toYear, toMonth - 1, sourceDate.getDate());
        if (targetDate.getMonth() !== toMonth - 1) continue;

        const targetDateStr = targetDate.toISOString().split('T')[0];

        await supabase.from('monthly_allocations').insert([{
          date: targetDateStr, room_id: alloc.room_id, doctor_id: alloc.doctor_id, shift: alloc.shift
        }]);
        copiedCount++;
      }
      res.json({ success: true, copied: copiedCount });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.delete('/api/monthly-allocations/:id', async (req, res) => {
    try {
      const { error } = await supabase.from('monthly_allocations').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.put('/api/monthly-allocations/:id', async (req, res) => {
    try {
      let { doctor_id, date, room_id, shift } = req.body;
      const { id } = req.params;

      if (doctor_id === 'INTERDITADO') {
        doctor_id = null;
      }

      if (date && room_id && shift) {
        let conflictShifts = [];
        if (shift === 'MANHÃ/TARDE') conflictShifts = ['MANHÃ', 'TARDE', 'MANHÃ/TARDE'];
        else if (shift === 'MANHÃ') conflictShifts = ['MANHÃ', 'MANHÃ/TARDE'];
        else if (shift === 'TARDE') conflictShifts = ['TARDE', 'MANHÃ/TARDE'];
        else conflictShifts = [shift, 'MANHÃ/TARDE'];

        const { data: conflicts, error: conflictErr } = await supabase
          .from('monthly_allocations')
          .select('id')
          .eq('date', date)
          .eq('room_id', room_id)
          .neq('id', id)
          .in('shift', conflictShifts);

        if (conflictErr) throw conflictErr;
        if (conflicts && conflicts.length > 0) {
          return res.status(409).json({ error: 'Sala já ocupada' });
        }

        await supabase.from('monthly_allocations').update({ date, room_id, shift }).eq('id', id);
      } else if (doctor_id !== undefined) {
        // Allow null (interdiction) or a valid doctor_id
        await supabase.from('monthly_allocations').update({ doctor_id: doctor_id || null }).eq('id', id);
      }

      const { data, error } = await supabase
        .from('monthly_allocations')
        .select(`
          id, date, shift, room_id, doctor_id,
          room:rooms(name, color, type),
          doctor:doctors(name, specialty)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      res.json({
        ...data,
        room_name: (data as any).room?.name,
        room_color: (data as any).room?.color,
        room_type: (data as any).room?.type,
        doctor_name: (data as any).doctor?.name,
        doctor_specialty: (data as any).doctor?.specialty
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
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

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Connected to Supabase project: dxzdhuctkfunaozeugxv`);
  });
}

startServer();
