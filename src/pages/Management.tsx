import React, { useState } from 'react';
import { Doctor, Room } from '../types';
import { Trash2, Edit2, Plus, Save, Users, LayoutGrid, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useManagementData } from '../hooks/useManagementData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

// Shared styles
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

  // New states for tabs, pagination and rows per page
  const [activeTab, setActiveTab] = useState<'doctors' | 'rooms'>('doctors');
  const [docPage, setDocPage] = useState(1);
  const [roomPage, setRoomPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const validDocPage = Math.min(docPage, Math.ceil(doctors.length / rowsPerPage) || 1);
  const paginatedDoctors = doctors.slice((validDocPage - 1) * rowsPerPage, validDocPage * rowsPerPage);
  const totalDocPages = Math.ceil(doctors.length / rowsPerPage) || 1;

  const validRoomPage = Math.min(roomPage, Math.ceil(rooms.length / rowsPerPage) || 1);
  const paginatedRooms = rooms.slice((validRoomPage - 1) * rowsPerPage, validRoomPage * rowsPerPage);
  const totalRoomPages = Math.ceil(rooms.length / rowsPerPage) || 1;

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
    setTimeout(() => {
      document.getElementById('form-section-doctors')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
    setTimeout(() => {
      document.getElementById('form-section-rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCancelRoom = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomType('General');
  };

  const renderPagination = (
    totalItems: number,
    currentPage: number,
    totalPages: number,
    setPage: (p: number) => void,
    rowsPerPage: number,
    setRowsPerPage: (n: number) => void
  ) => {
    return (
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-white gap-4">
        <div className="text-sm font-medium text-gray-500">
          {totalItems} linha{totalItems !== 1 ? 's' : ''} no total.
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-gray-600 font-medium">
          <div className="flex items-center gap-2">
            <span>Linhas por página:</span>
            <select
              className="border border-gray-200 rounded p-1 outline-none bg-white cursor-pointer hover:border-brand-primary/50 transition-colors"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1); // Reset to first page when changing rows per page
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div>
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 max-w-sm mx-auto">
        <button
          onClick={() => setActiveTab('doctors')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'doctors' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
        >
          <Users className="w-4 h-4" />
          Médicos
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'rooms' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
        >
          <LayoutGrid className="w-4 h-4" />
          Salas
        </button>
      </div>

      {activeTab === 'doctors' && (
        <section id="form-section-doctors" className="bg-white shadow rounded-lg p-4 md:p-6 border border-gray-100 animate-in fade-in duration-300">
          <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
            <Users className="w-5 h-5 mr-2 text-brand-primary" /> Médicos
          </h2>

          <div className="flex flex-col md:flex-row items-end gap-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
              <Input
                label="Nome do Médico"
                placeholder="Nome do Médico"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />
              <Input
                label="Especialidade"
                placeholder="Especialidade"
                value={docSpecialty}
                onChange={(e) => setDocSpecialty(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto h-[46px]">
              {editingDoctor && (
                <Button variant="secondary" onClick={handleCancelDoctor} className="whitespace-nowrap h-full">
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSaveDoctor} className="flex-1 md:flex-none whitespace-nowrap h-full">
                {editingDoctor ? <Save className="w-5 h-5 mr-2 flex-shrink-0" /> : <Plus className="w-5 h-5 mr-2 flex-shrink-0" />}
                {editingDoctor ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl relative shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 bg-white">
                <thead className="bg-gray-50/90">
                  <tr>
                    <th className={thClass}>Nome</th>
                    <th className={thClass}>Especialidade</th>
                    <th className={`${thClass} text-right`}>Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className={`${tdClass} font-medium text-gray-900`}>{doc.name}</td>
                      <td className={`${tdClass} text-gray-600`}>{doc.specialty}</td>
                      <td className={`${tdClass} text-right font-medium`}>
                        <Button variant="icon-edit" onClick={() => handleEditDoctor(doc)} title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="icon-delete" onClick={() => deleteDoctor(doc.id)} className="ml-1" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {doctors.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-400 italic">
                        Nenhum médico cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {doctors.length > 0 && renderPagination(doctors.length, validDocPage, totalDocPages, setDocPage, rowsPerPage, setRowsPerPage)}
          </div>
        </section>
      )}

      {activeTab === 'rooms' && (
        <section id="form-section-rooms" className="bg-white shadow rounded-lg p-4 md:p-6 border border-gray-100 animate-in fade-in duration-300">
          <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
            <LayoutGrid className="w-5 h-5 mr-2 text-brand-primary" /> Salas
          </h2>

          <div className="flex flex-col md:flex-row items-end gap-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
              <Input
                label="Nome da Sala"
                placeholder="Ex: SALA 01"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
              <Select
                label="Tipo"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as Room['type'])}
                options={[
                  { value: 'General', label: 'Geral' },
                  { value: 'Gine/Obst', label: 'Ginecologia/Obstetrícia' },
                  { value: 'Pediatria', label: 'Pediatria' }
                ]}
                className="cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto h-[46px]">
              {editingRoom && (
                <Button variant="secondary" onClick={handleCancelRoom} className="whitespace-nowrap h-full">
                  Cancelar
                </Button>
              )}
              <Button onClick={handleSaveRoom} className="flex-1 md:flex-none whitespace-nowrap h-full">
                {editingRoom ? <Save className="w-5 h-5 mr-2 flex-shrink-0" /> : <Plus className="w-5 h-5 mr-2 flex-shrink-0" />}
                {editingRoom ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl relative shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 bg-white">
                <thead className="bg-gray-50/90">
                  <tr>
                    <th className={thClass}>Nome</th>
                    <th className={thClass}>Tipo</th>
                    <th className={`${thClass} text-right`}>Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedRooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className={`${tdClass} font-semibold text-gray-900 flex items-center gap-3`}>
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: room.color || '#ccc' }} title="Cor de identificação da sala" />
                        {room.name}
                      </td>
                      <td className={`${tdClass} text-gray-600`}>
                        {room.type === 'General' ? 'Geral' : room.type === 'Gine/Obst' ? 'Ginecologia/Obstetrícia' : 'Pediatria'}
                      </td>
                      <td className={`${tdClass} text-right font-medium`}>
                        <Button variant="icon-edit" onClick={() => handleEditRoom(room)} title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="icon-delete" onClick={() => deleteRoom(room.id)} className="ml-1" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
            {rooms.length > 0 && renderPagination(rooms.length, validRoomPage, totalRoomPages, setRoomPage, rowsPerPage, setRowsPerPage)}
          </div>
        </section>
      )}
    </div>
  );
}
