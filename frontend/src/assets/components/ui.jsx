// src/components/ui.jsx
export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-white rounded-xl border border-zinc-200 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Pill({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function Difficulty({ level }) {
  const colors = {
    Fácil: "bg-green-100 text-green-800 border-green-200",
    Médio: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Difícil: "bg-red-100 text-red-800 border-red-200",
    "Em breve": "bg-gray-100 text-gray-800 border-gray-200",
  };

  return <Pill className={colors[level]}>{level}</Pill>;
}

export function Skill({ children }) {
  return (
    <Pill className="bg-blue-50 text-blue-700 border-blue-200">{children}</Pill>
  );
}

export function Meta({ icon, children }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-600">
      <span>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export function PrimaryButton({ children, disabled = false, ...props }) {
  return (
    <button
      disabled={disabled}
      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}
