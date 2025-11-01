'use client';

export default function AdminTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">🎯 Test Admin Page</h1>
      <p className="text-lg">Si ves esto, la página admin funciona!</p>
      
      <div className="mt-8 p-4 border-2 border-green-500 rounded-lg bg-green-50">
        <h2 className="text-xl font-bold text-green-800">✅ CREAR USUARIO</h2>
        <p className="text-green-700 mt-2">Esta es la función que buscas!</p>
        
        <form className="mt-4 space-y-4">
          <div>
            <label className="block font-semibold">Email:</label>
            <input type="email" className="w-full p-2 border rounded" placeholder="usuario@email.com" />
          </div>
          <div>
            <label className="block font-semibold">Nombre:</label>
            <input type="text" className="w-full p-2 border rounded" placeholder="Juan Pérez" />
          </div>
          <div>
            <label className="block font-semibold">Rol:</label>
            <select className="w-full p-2 border rounded">
              <option value="customer">Cliente</option>
              <option value="agent">Agente</option>
              <option value="evaluator">Evaluador</option>
            </select>
          </div>
          <button 
            type="button" 
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            onClick={() => alert('¡Función de crear usuario funcionando!')}
          >
            🚀 CREAR USUARIO
          </button>
        </form>
      </div>
    </div>
  );
}