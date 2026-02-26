export default function AlertBanner({ alerts }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-start gap-2">
          <span className="text-amber-600 font-bold text-lg">!</span>
          <div>
            <p className="font-medium text-amber-800">Stock bajo en {alerts.length} accesorio(s):</p>
            <ul className="mt-1 text-sm text-amber-700">
              {alerts.map((a) => (
                <li key={a.id}>
                  <span className="font-medium">{a.name}</span> — quedan {a.quantity} (min: {a.min_quantity})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
