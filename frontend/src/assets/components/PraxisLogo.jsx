// src/assets/components/PraxisLogo.jsx
import React from 'react';

export default function PraxisLogo({ className = "h-12" }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Escadas (ícone) - estilo diagonal como na logo original */}
      <svg className="w-auto h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Listra 1 - Preta (topo, pequena) */}
        <polygon points="20,5 45,5 42,15 17,15" fill="#000000" />
        
        {/* Listra 2 - Amarela */}
        <polygon points="18,18 55,18 50,32 13,32" fill="#F1C40F" />
        
        {/* Listra 3 - Amarela (mais larga) */}
        <polygon points="16,35 65,35 58,52 9,52" fill="#F1C40F" />
        
        {/* Listra 4 - Preta (larga) */}
        <polygon points="14,55 75,55 66,75 5,75" fill="#000000" />
        
        {/* Listra 5 - Amarela (base, a mais larga) */}
        <polygon points="12,78 85,78 74,98 0,98" fill="#F1C40F" />
      </svg>
      
      {/* Texto PRAXIS com slogan */}
      <div className="flex flex-col">
        <span className="font-black text-2xl tracking-tight leading-none">PRAXIS</span>
        <span className="text-[8px] tracking-widest font-medium text-zinc-600 mt-0.5">
          SIMULE | EVOLUA | PRATIQUE
        </span>
      </div>
    </div>
  );
}
