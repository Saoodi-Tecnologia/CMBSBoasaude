import React from 'react';

interface ConfirmClearModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    currentWeekRange: string;
}

export default function ConfirmClearModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    currentWeekRange,
}: ConfirmClearModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                <div className="px-6 py-6 text-center md:text-left">
                    <h2 className="text-xl font-extrabold text-gray-900 mb-2">Trocar semana?</h2>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        Os dados de alocacao da semana atual serao apagados permanentemente do banco ao trocar para a nova semana.
                        Essa acao nao pode ser desfeita.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left">
                        <p className="text-xs text-amber-800 font-bold">Semana atual: {currentWeekRange}</p>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-5 flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? 'Apagando...' : 'Confirmar e trocar semana'}
                    </button>
                </div>
            </div>
        </div>
    );
}
