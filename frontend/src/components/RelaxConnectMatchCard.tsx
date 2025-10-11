export default function RelaxConnectMatchCard() {
  return (
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-center p-12">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md border border-white/20 shadow-2xl relative overflow-hidden">
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-600/10 rounded-3xl"></div>
        
        {/* Professional corner accents */}
        <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-transparent rounded-br-3xl"></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-tl-3xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight leading-tight">Relax. Connect. Match.</h2>
          <p className="text-white/95 text-base font-medium leading-relaxed">Find meaningful connections and intentional love with Web3 professionals</p>
        </div>
      </div>
    </div>
  )
}
