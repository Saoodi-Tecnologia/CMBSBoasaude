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
        const confirmed = window.confirm('Deseja realmente excluir este médico?');
        if (!confirmed) return;

        const { error } = await supabase.from('doctors').delete().eq('id', id);

        if (error) {
            console.error('Erro ao excluir médico:', error);
            if (error.code === '23503') {
                alert('Não é possível excluir este médico pois ele já possui alocações ou escalas registradas.');
            } else {
                alert('Erro ao excluir médico. Tente novamente.');
            }
        } else {
            fetchDoctors();
        }
    };

    const saveRoom = async (name: string, type: Room['type'], editingId?: string) => {
        if (!name) return;

        const colorPalettes = {
            'Gine/Obst': ['#E91E63', '#F06292', '#D81B60', '#EC407A', '#C2185B'],
            'Pediatria': ['#2196F3', '#64B5F6', '#1976D2', '#42A5F5', '#1E88E5'],
            'General': ['#4CAF50', '#81C784', '#388E3C', '#66BB6A', '#43A047']
        };

        const randomColor = colorPalettes[type][Math.floor(Math.random() * colorPalettes[type].length)];

        if (editingId) {
            const { error } = await supabase
                .from('rooms')
                .update({ name, type, color: randomColor })
                .eq('id', editingId);
            if (error) console.error(error);
        } else {
            const { error } = await supabase
                .from('rooms')
                .insert([{ name, type, color: randomColor }]);
            if (error) console.error(error);
        }
        fetchRooms();
    };

    const deleteRoom = async (id: string) => {
        const confirmed = window.confirm('Deseja realmente excluir esta sala?');
        if (!confirmed) return;

        const { error } = await supabase.from('rooms').delete().eq('id', id);

        if (error) {
            console.error('Erro ao excluir sala:', error);
            if (error.code === '23503') {
                alert('Não é possível excluir esta sala pois ela já possui alocações ou escalas registradas.');
            } else {
                alert('Erro ao excluir sala. Tente novamente.');
            }
        } else {
            fetchRooms();
        }
    };

    return { doctors, rooms, saveDoctor, deleteDoctor, saveRoom, deleteRoom };
}
