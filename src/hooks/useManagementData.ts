import { useState, useCallback, useEffect } from 'react';
import { Doctor, Room } from '../types';
import { supabase } from '../../supabase';

export function useManagementData() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);

    const fetchDoctors = useCallback(async () => {
        const { data, error } = await supabase.from('doctors').select('*');
        if (!error) setDoctors(data || []);
    }, []);

    const fetchRooms = useCallback(async () => {
        const { data, error } = await supabase.from('rooms').select('*');
        if (!error && data) {
            const sorted = [...data].sort((a: Room, b: Room) =>
                a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
            );
            setRooms(sorted);
        }
    }, []);

    useEffect(() => {
        fetchDoctors();
        fetchRooms();
    }, [fetchDoctors, fetchRooms]);

    const saveDoctor = async (name: string, specialty: string, editingId?: string) => {
        if (!name || !specialty) return;
        if (editingId) {
            const { error } = await supabase
                .from('doctors')
                .update({ name, specialty })
                .eq('id', editingId);
            if (error) console.error(error);
        } else {
            const { error } = await supabase.from('doctors').insert([{ name, specialty }]);
            if (error) console.error(error);
        }
        fetchDoctors();
    };

    const deleteDoctor = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este medico?')) return;
        const { error } = await supabase.from('doctors').delete().eq('id', id);
        if (!error) fetchDoctors();
    };

    const saveRoom = async (name: string, type: Room['type'], editingId?: string) => {
        if (!name) return;
        if (editingId) {
            const { error } = await supabase.from('rooms').update({ name, type }).eq('id', editingId);
            if (error) console.error(error);
        } else {
            const { error } = await supabase.from('rooms').insert([{ name, type }]);
            if (error) console.error(error);
        }
        fetchRooms();
    };

    const deleteRoom = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta sala?')) return;
        const { error } = await supabase.from('rooms').delete().eq('id', id);
        if (!error) fetchRooms();
    };

    return { doctors, rooms, saveDoctor, deleteDoctor, saveRoom, deleteRoom };
}
