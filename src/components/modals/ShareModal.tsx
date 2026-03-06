import React, { useState } from 'react';
import { X, Link, Copy, Check, ExternalLink } from 'lucide-react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
    type?: string;
}

export default function ShareModal({ isOpen, onClose, shareUrl, type = 'da semana' }: ShareModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                <div className="bg-white border-b border-gray-100 px-5 md:px-6 py-4 flex justify-between items-center">
                    <h2 className="text-lg font-extrabold text-gray-900">Compartilhar Mapa</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 md:p-6 space-y-5">
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-gray-700 flex items-center">
                            <Link className="w-4 h-4 mr-2 text-brand-primary" />
                            Link público {type}
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs text-gray-600 font-mono focus:outline-none"
                                onFocus={(e) => e.target.select()}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopy}
                                    title="Copiar link"
                                    className={`flex-1 sm:flex-none p-3 rounded-xl transition-all flex items-center justify-center border ${copied
                                        ? 'bg-brand-secondary/10 border-brand-secondary text-brand-secondary'
                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5 md:w-4 md:h-4" />}
                                    <span className="sm:hidden ml-2">{copied ? 'Copiado!' : 'Copiar'}</span>
                                </button>
                                <a
                                    href={shareUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Abrir em nova aba"
                                    className="flex-1 sm:flex-none p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center"
                                >
                                    <ExternalLink className="w-5 h-5 md:w-4 md:h-4" />
                                    <span className="sm:hidden ml-2">Abrir</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="bg-brand-secondary/10 border border-brand-secondary/20 rounded-xl p-4">
                        <p className="text-xs text-brand-secondary font-semibold leading-relaxed">
                            Este link permite que qualquer pessoa visualize o cronograma atualizado em tempo real sem precisar de senha.
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
