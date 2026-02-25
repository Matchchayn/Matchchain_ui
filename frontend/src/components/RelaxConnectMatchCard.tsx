export default function RelaxConnectMatchCard() {
  return (
    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1f]/90 via-[#0a0a1f]/40 to-transparent flex items-end justify-center p-12">
      <div className="bg-[#1a1a2e]/30 backdrop-blur-2xl rounded-[2.5rem] p-10 max-w-md border border-white/5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        {/* Animated glow effect */}
        <div className="absolute -inset-[100%] bg-gradient-to-br from-purple-600/20 via-transparent to-pink-500/20 group-hover:animate-pulse"></div>

        {/* Soft edge highlight */}
        <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"></div>

        <div className="relative z-10 text-center sm:text-left">
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight leading-tight bg-clip-text">
            Relax. Connect. Match.
          </h2>
          <p className="text-white/80 text-base font-medium leading-relaxed">
            Find meaningful connections and intentional love with Web3 professionals
          </p>
        </div>
      </div>
    </div>
  )
}
