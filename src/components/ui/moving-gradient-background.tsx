import React from "react";

export function MovingGradientBackground() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-[-10] bg-[#06070a]">
      {/* Soft Aurora Blobs */}
      <div className="absolute top-[10%] left-[15%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-emerald-500/6 blur-[110px] animate-blob-1" />
      <div className="absolute top-[35%] right-[5%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] rounded-full bg-nagrik-blue/6 blur-[130px] animate-blob-2" />
      <div className="absolute bottom-[5%] left-[5%] w-[38vw] h-[38vw] max-w-[500px] max-h-[500px] rounded-full bg-purple-500/6 blur-[120px] animate-blob-3" />
      
      {/* Subtle Noise Grain for texture */}
      <div 
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
