import React, { useState } from 'react';
import { Doctor, Room } from '../types';
import { Trash2, Edit2, Plus, Save, Users, LayoutGrid } from 'lucide-react';
import { useManagementData } from '../hooks/useManagementData';

// Shared styles
const inputClass =
  'border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all';
const labelClass = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2';
const btnPrimary =
  'bg-brand-primary text-white px-6 py-3 rounded-xl hover:opacity-90 flex items-center justify-center transition-all shadow-lg hover:shadow-brand-primary/20 font-bold';
const btnIconEdit = 'text-brand-primary hover:opacity-80 p-2';
const btnIconDelete = 'text-red-500 hover:text-red-700 p-2 ml-1';
const thClass =
  'px-4 md:px-6 py-4 text-left text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest';
const tdClass = 'px-4 md:px-6 py-4 whitespace-nowrap text-sm';

export default function Management() {
  const { doctors, rooms, saveDoctor, deleteDoctor, saveRoom, deleteRoom } = useManagementData();

  // Doctor form state
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');

  // Room form state
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<Room['type']>('General');

  const handleSaveDoctor = async () => {
    await saveDoctor(docName, docSpecialty, editingDoctor?.id);
    setEditingDoctor(null);
    setDocName('');
    setDocSpecialty('');
  };

  const handleEditDoctor = (doc: Doctor) => {
    setEditingDoctor(doc);
    setDocName(doc.name);
    setDocSpecialty(doc.specialty);
  };

  const handleCancelDoctor = () => {
    setEditingDoctor(null);
    setDocName('');
    setDocSpecialty('');
  };

  const handleSaveRoom = async () => {
    await saveRoom(roomName, roomType, editingRoom?.id);
    setEditingRoom(null);
    setRoomName('');
    setRoomType('General');
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRoomType(room.type);
  };

  const handleCancelRoom = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomType('General');
  };

  return (
    <div className="space-y-8">

      {/* Doctors Section */}
      <section className="bg-white shadow rounded-lg p-4 md:p-6 border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
          <Users className="w-5 h-5 mr-2 text-brand-primary" /> Medicos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <input
            type="text"
            placeholder="Nome do Medico"
            className={inputClass}
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Especialidade"
            className={inputClass}
            value={docSpecialty}
            onChange={(e) => setDocSpecialty(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <button onClick={handleSaveDoctor} className={btnPrimary}>
              {editingDoctor ? <Save className="w-5 h-5 mr-2 flex-shrink-0" /> : <Plus className="w-5 h-5 mr-2 flex-shrink-0" />}
              {editingDoctor ? 'Atualizar' : 'Adicionar'}
            </button>
            {editingDoctor && (
              <button onClick={handleCancelDoctor} className="text-xs text-gray-400 hover:text-gray-600 underline text-center">
                CancelarEdicao
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className={thClass}>Nome</th>
                <th className={thClass}>Especialidade</th>
                <th className={`${thClass} text-right`}>Acoes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {doctors.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className={`${tdClass} font-medium text-gray-900`}>{doc.name}</td>
                  <td className={`${tdClass} text-gray-600`}>{doc.specialty}</td>
                  <td className={`${tdClass} text-right font-medium`}>
                    <button onClick={() => handleEditDoctor(doc)} className={btnIconEdit}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteDoctor(doc.id)} className={btnIconDelete}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-400 italic">
                    Nenhum medico cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="bg-white shadow rounded-lg p-4 md:p-6 border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
          <LayoutGrid className="w-5 h-5 mr-2 text-brand-primary" /> Salas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8 items-end">
          <div className="md:col-span-6">
            <label className={labelClass}>Nome da Sala (ex: SALA 01)</label>
            <input
              type="text"
              placeholder="Nome da Sala"
              className={`w-full ${inputClass}`}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <label className={labelClass}>Tipo</label>
            <select
              className={`w-full ${inputClass} cursor-pointer`}
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as Room['type'])}
            >
              <option value="General">Geral</option>
              <option value="Gine/Obst">Ginecologia/Obstetricia</option>
            </select>
          </div>
          <div className="md:col-span-3 flex flex-col gap-2">
            <button onClick={handleSaveRoom} className={`w-full ${btnPrimary}`}>
              {editingRoom ? <Save className="w-5 h-5 mr-2 flex-shrink-0" /> : <Plus className="w-5 h-5 mr-2 flex-shrink-0" />}
              {editingRoom ? 'Atualizar' : 'Adicionar'}
            </button>
            {editingRoom && (
              <button onClick={handleCancelRoom} className="text-xs text-gray-400 hover:text-gray-600 underline text-center">
                CancelarEdicao
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className={thClass}>Nome</th>
                <th className={thClass}>Tipo</th>
                <th className={`${thClass} text-right`}>Acoes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className={`${tdClass} font-semibold text-gray-900`}>{room.name}</td>
                  <td className={`${tdClass} text-gray-600`}>
                    {room.type === 'General' ? 'Geral' : 'Ginecologia/Obstetricia'}
                  </td>
                  <td className={`${tdClass} text-right font-medium`}>
                    <button onClick={() => handleEditRoom(room)} className={btnIconEdit}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteRoom(room.id)} className={btnIconDelete}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-400 italic">
                    Nenhuma sala cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
