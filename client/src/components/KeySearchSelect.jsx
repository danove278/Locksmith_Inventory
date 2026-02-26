import { useState, useEffect, useRef } from 'react';
import { searchAccessories } from '../api';

export default function KeySearchSelect({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (query.length === 0) {
      searchAccessories('').then(setResults).catch(() => {});
      return;
    }
    const timer = setTimeout(() => {
      searchAccessories(query).then(setResults).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (acc) => {
    onChange(acc);
    setQuery(acc.name);
    setIsOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Llave usada *</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(null); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar llave en inventario..."
          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        {value && (
          <button type="button" onClick={clear} className="px-3 py-2 text-gray-500 hover:text-red-600">
            X
          </button>
        )}
      </div>
      {value && (
        <p className="mt-1 text-sm text-green-700">
          Seleccionada: <strong>{value.name}</strong> (disponibles: {value.quantity})
        </p>
      )}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((acc) => (
            <li key={acc.id}>
              <button
                type="button"
                onClick={() => select(acc)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 flex justify-between items-center"
              >
                <span className="font-medium">{acc.name}</span>
                <span className="text-sm text-gray-500">Stock: {acc.quantity}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {isOpen && query && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg p-3 text-sm text-gray-500">
          No se encontraron llaves con stock disponible
        </div>
      )}
    </div>
  );
}
