'use client';

import { useState, useEffect } from 'react';

export default function MapModal() {
  const [isOpen, setIsOpen] = useState(false);

  // This function would be triggered by a global state or event in a real app
  // For now, we'll expose a way to toggle it via window for the demo script compatibility
  useEffect(() => {
    // @ts-ignore
    window.toggleMapModal = () => setIsOpen(!isOpen);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div id="map-modal" className="fixed inset-0 z-modal bg-white flex flex-col">
        <div className="h-16 border-b flex items-center justify-between px-6 bg-white shrink-0">
            <h3 className="font-black text-lg">Interactive Map View</h3>
            <button onClick={() => setIsOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>
        <div id="map" className="flex-1">
            <div style={{ height: '100%', width: '100%' }}>
                <div style={{ overflow: 'hidden' }}></div>
            </div>
        </div>
        {/* Map Sidebar/Overlay */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pointer-events-none">
            <div className="bg-white/90 backdrop-blur p-4 rounded-3xl shadow-2xl border border-gray-100 pointer-events-auto flex items-center justify-between">
                <div className="flex gap-4">
                    <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black">Draw Search Area</button>
                    <button className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">Show Points of Interest</button>
                </div>
                <div className="text-[10px] font-bold text-slate-400">Total Markers: <span id="marker-count">5</span></div>
            </div>
        </div>
    </div>
  );
}