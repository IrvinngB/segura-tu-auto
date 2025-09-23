"use client";

import { useState } from "react";
import { DebugModal } from "@/components/ui/debug-modal";
import { SuccessModal } from "@/components/ui/success-modal";
import { SimpleSuccessModal } from "@/components/ui/simple-success-modal";

export default function TestModalsPage() {
    const [showDebugModal, setShowDebugModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showSimpleModal, setShowSimpleModal] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    🧪 Página de Prueba de Modales
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-red-600">
                            Debug Modal
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Modal extremadamente simple con estilos inline
                        </p>
                        <button
                            onClick={() => setShowDebugModal(true)}
                            className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                        >
                            Mostrar Debug Modal
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-green-600">
                            Success Modal (Portal)
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Modal con Portal renderizado en document.body
                        </p>
                        <button
                            onClick={() => setShowSuccessModal(true)}
                            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                        >
                            Mostrar Success Modal
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-blue-600">
                            Simple Modal (Sin Portal)
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Modal simple sin Portal
                        </p>
                        <button
                            onClick={() => setShowSimpleModal(true)}
                            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                            Mostrar Simple Modal
                        </button>
                    </div>
                </div>

                <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-purple-600">
                        Instrucciones de Prueba
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Abre las herramientas de desarrollador (F12)</li>
                        <li>Ve a la pestaña Console</li>
                        <li>Haz clic en cada botón uno por uno</li>
                        <li>Observa qué logs aparecen en la consola</li>
                        <li>Observa qué modales aparecen (si alguno)</li>
                        <li>Reporta qué ves y qué no ves</li>
                    </ol>
                </div>
            </div>

            {/* Renderizar todos los modales */}
            <DebugModal
                show={showDebugModal}
                onClose={() => setShowDebugModal(false)}
            />

            <SuccessModal
                show={showSuccessModal}
                title="¡Prueba Exitosa!"
                message="Este es el modal con Portal. Si lo ves, el Portal funciona correctamente."
                duration={5000}
                onClose={() => setShowSuccessModal(false)}
            />

            <SimpleSuccessModal
                show={showSimpleModal}
                title="¡Prueba Simple Exitosa!"
                message="Este es el modal simple sin Portal. Si lo ves, el renderizado básico funciona."
                duration={5000}
                onClose={() => setShowSimpleModal(false)}
            />
        </div>
    );
}
