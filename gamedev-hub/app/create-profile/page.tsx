export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col justify-between p-8">
      <video
        src="/background.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-80 pointer-events-none z-0"
      />

      <header className="relative z-10 flex justify-between items-center w-full max-w-7xl mx-auto">
        <span className="font-bold text-lg tracking-wider">GameDev Hub</span>
        <a href="#login" className="text-sm text-zinc-300 hover:text-white transition">
          Přihlásit se / Registrovat
        </a>
      </header>

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto my-auto">
        <h1 className="text-6xl font-extrabold tracking-tight mb-6 drop-shadow-lg">
          Tvoř Svou Hru. Najdi Tým.
        </h1>
        <p className="text-zinc-200 text-xl mb-8 max-w-xl mx-auto drop-shadow-md">
          Prostor pro herní vývojáře. Prezentuj svá portfolia, sdílej ukázky práce a propoj se s ostatními tvůrci přímo přes Discord.
        </p>
        <button className="bg-white text-black font-semibold px-8 py-4 rounded-xl hover:bg-zinc-200 transition shadow-xl">
          Vytvořit prezentaci & Založit účet
        </button>
      </div>

      <div className="relative z-10"></div>
    </main>
  );
}
