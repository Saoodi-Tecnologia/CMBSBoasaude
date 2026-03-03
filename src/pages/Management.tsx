import React, { useState, useEffect } from 'react';
import { Doctor, Room } from '../types';
import { Trash2, Edit2, Plus, Save, X, Users, LayoutGrid } from 'lucide-react';

export default function Management() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Doctor Form State
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');

  // Room Form State
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'Gine/Obst' | 'General'>('General');

  useEffect(() => {
    fetchDoctors();
    fetchRooms();
  }, []);

  const fetchDoctors = async () => {
    const res = await fetch('/api/doctors');
    setDoctors(await res.json());
  };

  const fetchRooms = async () => {
    const res = await fetch('/api/rooms');
    const data = await res.json();
    // Sort rooms naturally (e.g., Sala 1, Sala 2, Sala 10)
    const sortedRooms = data.sort((a: Room, b: Room) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
    setRooms(sortedRooms);
  };

  const handleSaveDoctor = async () => {
    if (!docName || !docSpecialty) return;

    const method = editingDoctor ? 'PUT' : 'POST';
    const url = editingDoctor ? `/api/doctors/${editingDoctor.id}` : '/api/doctors';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: docName, specialty: docSpecialty }),
    });

    setEditingDoctor(null);
    setDocName('');
    setDocSpecialty('');
    fetchDoctors();
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este medico?')) return;
    await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
    fetchDoctors();
  };

  const handleSaveRoom = async () => {
    if (!roomName) return;

    const method = editingRoom ? 'PUT' : 'POST';
    const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: roomName, type: roomType }),
    });

    setEditingRoom(null);
    setRoomName('');
    setRoomType('General');
    fetchRooms();
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sala?')) return;
    await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
    fetchRooms();
  };

  return (
    <div className="space-y-8">
      {/* Doctors Section */}
      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" /> Médicos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Nome do Médico"
            className="border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Especialidade"
            className="border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
            value={docSpecialty}
            onChange={(e) => setDocSpecialty(e.target.value)}
          />
          <button
            onClick={handleSaveDoctor}
            className="bg-brand-primary text-white px-4 py-2 rounded hover:opacity-90 flex items-center justify-center transition-all"
          >
            {editingDoctor ? <Save className="w-5 h-5 mr-2 flex-shrink-0" /> : <Plus className="w-5 h-5 mr-2 flex-shrink-0" />}
            {editingDoctor ? 'Atualizar' : 'Adicionar'}
          </button>
          {editingDoctor && (
            <button
              onClick={() => {
                setEditingDoctor(null);
                setDocName('');
                setDocSpecialty('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidade</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{doc.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doc.specialty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingDoctor(doc);
                        setDocName(doc.name);
                        setDocSpecialty(doc.specialty);
                      }}
                      className="text-brand-primary hover:opacity-80 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDoctor(doc.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <LayoutGrid className="w-5 h-5 mr-2" /> Salas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 items-end">
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Sala (ex: SALA 01)</label>
            <input
              type="text"
              placeholder="Nome da Sala"
              className="w-full border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              className="w-full border border-gray-200 rounded p-2 focus:ring-1 focus:ring-brand-primary outline-none"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as any)}
            >
              <option value="General">Geral</option>
              <option value="Gine/Obst">Ginecologia/Obstetrícia</option>
            </select>
          </div>
          <div className="md:col-span-3 flex flex-col gap-2">
            <button
              onClick={handleSaveRoom}
              className="w-full bg-brand-primary text-white px-6 py-2.5 rounded hover:opacity-90 flex items-center justify-center transition-all font-bold"
            >
              {editingRoom ? <Save className="w-6 h-6 mr-2 flex-shrink-0" /> : <Plus className="w-6 h-6 mr-2 flex-shrink-0" />}
              {editingRoom ? 'Atualizar' : 'Adicionar'}
            </button>
            {editingRoom && (
              <button
                onClick={() => {
                  setEditingRoom(null);
                  setRoomName('');
                  setRoomType('General');
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline text-center"
              >
                Cancelar Edição
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {room.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {room.type === 'General' ? 'Geral' : 'Ginecologia/Obstetrícia'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingRoom(room);
                        setRoomName(room.name);
                        setRoomType(room.type);
                      }}
                      className="text-brand-primary hover:opacity-80 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
