'use client';

import { useState } from 'react';

const MOCK_DATA: any[] = [];

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentSound, setCurrentSound] = useState('/chimes-1.mp3');
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false);
  
  // Stavy pro modální okna a autentizaci
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Formulářové stavy
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  // Stavy pro vyhledávací okno
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'talents' | 'jobs'>('all');

  // 🔊 Spuštění zvoleného zvuku
  const startSound = () => {
    if (!soundEnabled) return;
    const audio = document.getElementById('hover-sound') as HTMLAudioElement;
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio čeká na interakci:", e));
    }
  };

  // 🔇 Zastavení zvuku při opuštění tlačítka
  const stopSound = () => {
    const audio = document.getElementById('hover-sound') as HTMLAudioElement;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const filteredResults = MOCK_DATA.filter(item => {
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.role.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'talents') return matchesQuery && item.type === 'talent';
    if (activeTab === 'jobs') return matchesQuery && item.type === 'job';
    return matchesQuery;
  });

  return (
    <main className={`relative min-h-screen overflow-x-hidden transition-colors duration-300 ${darkMode ? 'bg-black text-white' : 'bg-white text-zinc-900'}`}>
      {/* Skrytý audio element */}
      <audio id="hover-sound" src={currentSound} preload="auto" />

      {/* Video na pozadí */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`fixed inset-0 h-full w-full object-cover pointer-events-none z-0 transition-all duration-300 ${
          darkMode ? 'opacity-80' : 'opacity-90 invert brightness-125'
        }`}
      >
        <source src="/background.mp4" type="video/mp4" />
        Váš prohlížeč nepodporuje přehrávání videa.
      </video>

      {/* Horní lišta (hlavička natažená od kraje do kraje) */}
      <header className="relative z-20 flex justify-between items-center w-full px-10 py-8">
        {/* Zvětšené logo / odkaz na hlavní stránku na levém kraji */}
        <button
          onClick={() => {
            setIsSearchOpen(false);
            setIsAuthOpen(false);
            setSearchQuery('');
          }}
          onMouseEnter={startSound}
          onMouseLeave={stopSound}
          className="font-extrabold text-2xl tracking-wider cursor-pointer hover:opacity-80 transition text-left"
        >
          GameDev Hub
        </button>
        
        {/* Ovládací prvky na pravém kraji */}
        <div className="flex items-center gap-4">
          {/* Lupa */}
          <button
            onClick={() => setIsSearchOpen(true)}
            onMouseEnter={startSound}
            onMouseLeave={stopSound}
            className={`p-2.5 rounded-xl border transition shadow-sm cursor-pointer flex items-center justify-center ${
              darkMode ? 'border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-white' : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
            }`}
            title="Vyhledávání lidí a práce"
          >
            🔍
          </button>

          {/* Rozbalovací menu pro správu zvuku */}
          <div className="relative">
            <button
              onClick={() => setIsSoundMenuOpen(!isSoundMenuOpen)}
              onMouseEnter={startSound}
              onMouseLeave={stopSound}
              className={`text-sm px-3.5 py-2 rounded-xl border transition shadow-sm cursor-pointer flex items-center gap-2 ${
                darkMode ? 'border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-white' : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
              }`}
            >
              {soundEnabled ? '🔊 Zvuk' : '🔇 Ticho'} ▾
            </button>

            {isSoundMenuOpen && (
              <div className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-xl p-2 z-30 backdrop-blur-md ${
                darkMode ? 'border-zinc-800 bg-zinc-900/95 text-white' : 'border-zinc-200 bg-white/95 text-zinc-900'
              }`}>
                <div className="text-xs font-semibold px-3 py-1.5 opacity-60 uppercase tracking-wider">Nastavení zvuku</div>
                
                <button
                  onClick={() => { setSoundEnabled(!soundEnabled); setIsSoundMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-zinc-800/20 transition cursor-pointer flex items-center justify-between"
                >
                  <span>{soundEnabled ? 'Vypnout zvuky' : 'Zapnout zvuky'}</span>
                  <span>{soundEnabled ? '🔴' : '🟢'}</span>
                </button>

                <div className="my-1 border-t border-zinc-700/30"></div>
                <div className="text-xs font-semibold px-3 py-1.5 opacity-60 uppercase tracking-wider">Výběr efektu</div>

                <button
                  onClick={() => { setCurrentSound('/chimes-1.mp3'); setSoundEnabled(true); setIsSoundMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition cursor-pointer ${currentSound === '/chimes-1.mp3' ? 'font-bold opacity-100 bg-zinc-800/40' : 'opacity-70 hover:opacity-100'}`}
                >
                  ✨ Zvonkohra (Chimes)
                </button>

                <button
                  onClick={() => { setCurrentSound('/robot-run-bubbles.mp3'); setSoundEnabled(true); setIsSoundMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition cursor-pointer ${currentSound === '/robot-run-bubbles.mp3' ? 'font-bold opacity-100 bg-zinc-800/40' : 'opacity-70 hover:opacity-100'}`}
                >
                  🤖 Robot Bubbles
                </button>

                <button
                  onClick={() => { setCurrentSound('/winter-wind-wind-sound-fx-test-mi.mp3'); setSoundEnabled(true); setIsSoundMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition cursor-pointer ${currentSound === '/winter-wind-wind-sound-fx-test-mi.mp3' ? 'font-bold opacity-100 bg-zinc-800/40' : 'opacity-70 hover:opacity-100'}`}
                >
                  ❄️ Winter Wind
                </button>
              </div>
            )}
          </div>

          {/* Přepínač režimu */}
          <button
            onMouseEnter={startSound}
            onMouseLeave={stopSound}
            onClick={() => setDarkMode(!darkMode)}
            className={`text-sm px-4 py-2 rounded-xl border transition shadow-sm cursor-pointer ${
              darkMode ? 'border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-white' : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
            }`}
          >
            {darkMode ? '☀️ Světlý' : '🌙 Tmavý'}
          </button>

          {/* Uživatelské menu / Přihlášení */}
          {isLoggedIn ? (
            <div className={`text-sm px-4 py-2 rounded-xl border font-medium ${darkMode ? 'border-zinc-700 bg-zinc-900 text-white' : 'border-zinc-300 bg-zinc-100 text-zinc-900'}`}>
              👤 {userName || 'Tvůrce'}
            </div>
          ) : (
            <button 
              onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
              onMouseEnter={startSound}
              onMouseLeave={stopSound}
              className={`text-sm transition cursor-pointer ${darkMode ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 hover:text-black'}`}
            >
              Přihlásit se / Registrovat
            </button>
          )}
        </div>
      </header>

      {/* Hlavní Hero sekce */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto min-h-[75vh] justify-center px-4">
        <h1 className="text-6xl font-extrabold tracking-tight mb-6 drop-shadow-lg">
          Najdi Tým. Vytvoř Svou Hru.
        </h1>
        <p className={`text-xl mb-8 max-w-xl mx-auto drop-shadow-md ${darkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
          Prostor pro herní vývojáře. Prezentuj svá portfolia, sdílej ukázky práce a propoj se s ostatními tvůrci přímo přes Discord.
        </p>
        
        <button 
          onClick={() => { setAuthMode('register'); setIsAuthOpen(true); }}
          onMouseEnter={startSound}
          onMouseLeave={stopSound}
          className={`font-semibold px-8 py-4 rounded-xl transition shadow-xl cursor-pointer inline-block ${
            darkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
          }`}
        >
          Vytvořit prezentaci & Založit účet
        </button>
      </div>

      {/* PLOVOUCÍ DISCORD TLAČÍTKO V PRAVÉM DOLNÍM ROHU */}
      <a
        href="https://discord.gg/8uausrWGs3"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 cursor-pointer bg-[#5865F2] text-white border-[#5865F2]/50 hover:bg-[#4752C4]"
        title="Připoj se na náš Discord!"
      >
        <span className="text-xl">💬</span>
        <span className="text-sm font-bold tracking-wide">Discord server</span>
      </a>

      {/* MODÁLNÍ OKNO: Vyhledávání */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-2xl p-6 rounded-2xl border shadow-2xl relative max-h-[85vh] flex flex-col ${
            darkMode ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-zinc-200 bg-white text-zinc-900'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">🔍 Vyhledávání</h3>
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-2 rounded-lg hover:bg-zinc-800/20 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <input 
              type="text" 
              placeholder="Hledat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border outline-none mb-4 ${
                darkMode ? 'border-zinc-700 bg-zinc-900 text-white focus:border-white' : 'border-zinc-300 bg-zinc-100 text-zinc-900 focus:border-black'
              }`}
              autoFocus
            />

            <div className="flex gap-2 mb-4">
              <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'all' ? 'bg-white text-black' : 'bg-zinc-800/50 text-zinc-400'}`}>Vše</button>
              <button onClick={() => setActiveTab('talents')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'talents' ? 'bg-white text-black' : 'bg-zinc-800/50 text-zinc-400'}`}>👥 Lidé</button>
              <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'jobs' ? 'bg-white text-black' : 'bg-zinc-800/50 text-zinc-400'}`}>💼 Práce</button>
            </div>

            <div className="overflow-y-auto flex-1 flex flex-col items-center justify-center py-12 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-base font-medium opacity-80 mb-1">Zatím tu nikdo není</p>
              <p className="text-xs opacity-50 max-w-xs mb-6">
                Databáze je prázdná. Zaregistruj se a buď první, kdo tu vytvoří svůj profil nebo nabídku!
              </p>
              <button 
                onClick={() => { setIsSearchOpen(false); setAuthMode('register'); setIsAuthOpen(true); }}
                className={`text-xs px-4 py-2.5 rounded-xl font-semibold cursor-pointer ${darkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
              >
                Vytvořit první profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODÁLNÍ OKNO: Přihlášení / Registrace / Zapomenuté heslo */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md p-8 rounded-2xl border backdrop-blur-md shadow-2xl relative ${
            darkMode ? 'border-zinc-800 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-900'
          }`}>
            <button 
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-zinc-800/20 text-lg font-bold cursor-pointer"
            >
              ✕
            </button>

            {authMode !== 'forgot' && (
              <div className={`flex rounded-xl p-1 mb-6 border ${darkMode ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200 bg-zinc-100'}`}>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${authMode === 'register' ? 'bg-white text-black shadow' : 'opacity-60'}`}
                >
                  Registrace
                </button>
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${authMode === 'login' ? 'bg-white text-black shadow' : 'opacity-60'}`}
                >
                  Přihlášení
                </button>
              </div>
            )}

            <h2 className="text-2xl font-bold mb-2 text-center">
              {authMode === 'login' && 'Vítej zpět!'}
              {authMode === 'register' && 'Vytvořit účet'}
              {authMode === 'forgot' && 'Obnova hesla'}
            </h2>

            {authMode !== 'forgot' ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                setIsLoggedIn(true);
                setIsAuthOpen(false);
                alert(authMode === 'login' ? 'Úspěšně přihlášen!' : 'Účet byl vytvořen a jsi přihlášen!');
              }} className="flex flex-col gap-4 mt-6">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2">Jméno / Nickname</label>
                    <input 
                      type="text" 
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="např. PixelMaster"
                      className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'border-zinc-700 bg-zinc-800 text-white' : 'border-zinc-300 bg-zinc-100 text-zinc-900'}`}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2">E-mail</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vyvojar@gamedev.cz"
                    className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'border-zinc-700 bg-zinc-800 text-white' : 'border-zinc-300 bg-zinc-100 text-zinc-900'}`}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider">Heslo</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-xs text-indigo-400 hover:underline cursor-pointer"
                      >
                        Zapomenuté heslo?
                      </button>
                    )}
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'border-zinc-700 bg-zinc-800 text-white' : 'border-zinc-300 bg-zinc-100 text-zinc-900'}`}
                  />
                </div>

                <button
                  type="submit"
                  className={`mt-2 w-full py-3.5 rounded-xl font-semibold transition shadow-lg cursor-pointer ${
                    darkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                  }`}
                >
                  {authMode === 'login' ? 'Přihlásit se' : 'Zaregistrovat a vstoupit'}
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                alert(`Instrukce k obnovení hesla byly odeslány na e-mail: ${resetEmail}`);
                setAuthMode('login');
              }} className="flex flex-col gap-4 mt-6">
                <p className="text-xs text-center opacity-70 mb-2">
                  Zadej svůj e-mail a zašleme ti odkaz pro vytvoření nového hesla.
                </p>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2">E-mail</label>
                  <input 
                    type="email" 
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="vyvojar@gamedev.cz"
                    className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'border-zinc-700 bg-zinc-800 text-white' : 'border-zinc-300 bg-zinc-100 text-zinc-900'}`}
                  />
                </div>

                <button
                  type="submit"
                  className={`mt-2 w-full py-3.5 rounded-xl font-semibold transition shadow-lg cursor-pointer ${
                    darkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                  }`}
                >
                  Odeslat instrukce
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs text-center opacity-70 hover:opacity-100 mt-2 cursor-pointer"
                >
                  ← Zpět na přihlášení
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}