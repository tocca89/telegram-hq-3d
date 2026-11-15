export const OFFICES = [
  {
    id: "generale",
    topicId: "1",
    name: "Ufficio Generale",
    badge: "Topic #1",
    color: "#6366f1",
    glowColor: 0x6366f1,
    floorColor: 0x1e1b4b,
    accentColor: 0x818cf8,
    gridPos: { x: -14, z: -12 },
    size: { w: 12, d: 10 },
    icon: "⚡",
    description: "Quartier Generale dell'ecosistema. Centro di coordinamento strategico, triage delle richieste utente e orchestrazione dei sotto-agenti dell'homelab.",
    agents: [
      {
        name: "Antigravity Prime",
        role: "Head Coordinator & Orchestrator",
        status: "Online",
        avatarColor: "#818cf8",
        skills: ["run-workflow", "swarm", "system-dispatch", "deep-reasoning"],
        tasks: [
          "Supervisione globale di tutti i 6 topic Telegram",
          "Routing intelligente dei messaggi vocali e di testo",
          "Integrazione e memoria a lungo termine del sistema"
        ],
        stats: { tasksCompleted: 1420, uptime: "99.98%", model: "Gemini 3.8 Flash" }
      },
      {
        name: "Triage Dispatcher",
        role: "NLP Router & Context Manager",
        status: "In ascolto",
        avatarColor: "#a5b4fc",
        skills: ["fast-intent-detection", "context-memory"],
        tasks: [
          "Parsing e classificazione intenti in arrivo da Telegram",
          "Gestione priorità e smistamento canali dedicati"
        ],
        stats: { latency: "140ms", accuracy: "99.4%" }
      }
    ]
  },
  {
    id: "videostudio",
    topicId: "4",
    name: "Video Studio",
    badge: "Topic #4",
    color: "#ec4899",
    glowColor: 0xec4899,
    floorColor: 0x3b0764,
    accentColor: 0xf472b6,
    gridPos: { x: 0, z: -12 },
    size: { w: 12, d: 10 },
    icon: "🎬",
    description: "Hub multimediale per la produzione e il montaggio di Reel e TikTok verticali (9:16, 1080x1920), sound-design, sottotitoli dinamici e motion graphics.",
    agents: [
      {
        name: "Ghost Editor",
        role: "AI Talking-Head Reel Master",
        status: "Pronto",
        avatarColor: "#ec4899",
        skills: ["ghost-editor", "smart-silence-cut", "take-selection"],
        tasks: [
          "Trimming automatico delle pause morte e false partenze",
          "Montaggio multitraccia sincronizzato al parlato",
          "Rifinitura ritmica per massima retention TikTok/Reels"
        ],
        stats: { renderedVideos: 86, avgRenderTime: "42s" }
      },
      {
        name: "Whisper Captions",
        role: "Kinetic Typography & SRT Engine",
        status: "Standby",
        avatarColor: "#f472b6",
        skills: ["caption-animation", "faster-whisper-gpu", "word-highlight"],
        tasks: [
          "Trascrizione vocale frame-accurate con intelligenza locale",
          "Animazione pop-in parola per parola ad alto impatto",
          "Centratura e safe-area 9:16 verticale"
        ],
        stats: { wordSyncAccuracy: "99.8%" }
      },
      {
        name: "Remotion FX",
        role: "Programmatic Motion Graphics",
        status: "Standby",
        avatarColor: "#fb7185",
        skills: ["motion-skills", "ffmpeg-skill", "canvas-animation"],
        tasks: [
          "Generazione grafiche vettoriali in sovraimpressione",
          "B-roll check e sound effects mixing (LUFS standard)"
        ],
        stats: { fps: "60fps 1080p" }
      }
    ]
  },
  {
    id: "homelab",
    topicId: "5",
    name: "Homelab & DevOps",
    badge: "Topic #5",
    color: "#06b6d4",
    glowColor: 0x06b6d4,
    floorColor: 0x083344,
    accentColor: 0x22d3ee,
    gridPos: { x: 14, z: -12 },
    size: { w: 12, d: 10 },
    icon: "🖥️",
    description: "Centro server Linux, infrastruttura locale, container Docker, automazioni di sistema e il cuore del Telegram Bridge.",
    agents: [
      {
        name: "Bridge Guardian",
        role: "Telegram Bot & Process Watchdog",
        status: "Attivo 24/7",
        avatarColor: "#06b6d4",
        skills: ["bridge.py", "audio-transcription", "webhook-listener"],
        tasks: [
          "Ricezione e invio messaggi e note vocali Telegram",
          "Conversione audio oga/opus in streaming per Antigravity",
          "Controllo integrità sessioni e riavvio automatico"
        ],
        stats: { bridgeUptime: "99.9%", pendingMessages: 0 }
      },
      {
        name: "SysAdmin Bot",
        role: "Linux & Docker Engine Controller",
        status: "Online",
        avatarColor: "#22d3ee",
        skills: ["docker-compose", "secret-management", "gitleaks-auditor"],
        tasks: [
          "Controllo permessi e policy di sicurezza secret (chmod 600)",
          "Monitoraggio risorse CPU/RAM/Disco server casalingo",
          "Isolamento ambienti e container homelab"
        ],
        stats: { containersAlive: 14, memoryUsage: "38%" }
      }
    ]
  },
  {
    id: "takeoff",
    topicId: "6",
    name: "TakeOff CRM Lab",
    badge: "Topic #6",
    color: "#f59e0b",
    glowColor: 0xf59e0b,
    floorColor: 0x451a03,
    accentColor: 0xfbbf24,
    gridPos: { x: -14, z: 2 },
    size: { w: 12, d: 10 },
    icon: "💼",
    description: "Reparto operativo e integrazione per TakeOff CRM: gestione listini fornitori, importazione cataloghi multilingua e standardizzazione dati.",
    agents: [
      {
        name: "Catalog Importer",
        role: "Multilingual Ingestion Master",
        status: "Pronto",
        avatarColor: "#f59e0b",
        skills: ["takeoff-import-articles", "language-detector-v2", "xlsx-sanitizer"],
        tasks: [
          "Rilevamento automatico lingua sorgente (ES, CA, IT, EN, FR)",
          "Traduzione e localizzazione verso tenant target TakeOff",
          "Standardizzazione unità (pz, uds, uts) e codifica FAMILIA ARTICULOS"
        ],
        stats: { articlesImported: 42800, successRate: "99.94%" }
      },
      {
        name: "CRM API Agent",
        role: "TakeOff REST WebAPI Specialist",
        status: "Standby",
        avatarColor: "#fbbf24",
        skills: ["api.takeoffcrm.com", "batch-mutation", "schema-validator"],
        tasks: [
          "Verifica schemi e validazione payload prima dell'invio",
          "Sincronizzazione prezzi, stock, descrizioni e note di vendita"
        ],
        stats: { syncLatency: "95ms" }
      }
    ]
  },
  {
    id: "ricette",
    topicId: "81",
    name: "Cucina & Nutrizione",
    badge: "Topic #81",
    color: "#10b981",
    glowColor: 0x10b981,
    floorColor: 0x064e3b,
    accentColor: 0x34d399,
    gridPos: { x: 0, z: 2 },
    size: { w: 12, d: 10 },
    icon: "🍳",
    description: "Laboratorio culinario per ricette fit, bilanciamento macronutrienti e calcolo matematico delle dosi per qualsiasi dimensione di teglia o stampo.",
    agents: [
      {
        name: "Chef MacroFit",
        role: "Healthy Culinary Designer",
        status: "Ai fornelli",
        avatarColor: "#10b981",
        skills: ["baking-formulas", "greek-yogurt-substitutions", "carob-mastery"],
        tasks: [
          "Ribilanciamento ricette tradizionali in versioni fit ipocaloriche",
          "Formulazioni perfette (es. Plumcake cacao e carrube 40x10 cm)",
          "Sostituzione intelligente grassi e zuccheri raffinati"
        ],
        stats: { recipesCreated: 64, tasteRating: "⭐⭐⭐⭐⭐" }
      },
      {
        name: "Baking Scale Master",
        role: "Mold Geometry & Baker's Math",
        status: "Pronto",
        avatarColor: "#34d399",
        skills: ["volume-converter", "oven-temperature-timing"],
        tasks: [
          "Ricalcolo proporzionale ingredienti per stampi XXL (volume 3.2L)",
          "Prevenzione disastri da lievitazione e stime di cottura statico/ventilato"
        ],
        stats: { formulaAccuracy: "100%" }
      }
    ]
  },
  {
    id: "viaggi",
    topicId: "88",
    name: "Flight & Travel Ops",
    badge: "Topic #88",
    color: "#38bdf8",
    glowColor: 0x38bdf8,
    floorColor: 0x0c4a6e,
    accentColor: 0x7dd3fc,
    gridPos: { x: 14, z: 2 },
    size: { w: 12, d: 10 },
    icon: "✈️",
    description: "Centrale operativa viaggi e tariffe aeree. Motore integrato con Google Flights per la ricerca dei voli più economici e della logistica più comoda per la famiglia.",
    agents: [
      {
        name: "Fli Engine",
        role: "Live Google Flights Navigator",
        status: "Pronto",
        avatarColor: "#38bdf8",
        skills: ["flight-search", "fli-cli", "date-matrix-scanner"],
        tasks: [
          "Estrazione tariffe e orari reali senza API a pagamento",
          "Scansione combinazioni più economiche per ponti e weekend",
          "Filtri intelligenti per scali, compagnie e orari comodi"
        ],
        stats: { searchesLogged: 215, bestDealFound: "33 € A/R" }
      },
      {
        name: "Logistics Router",
        role: "Multi-Modal Travel Planner (Voli + AVE/Treni)",
        status: "Standby",
        avatarColor: "#7dd3fc",
        skills: ["route-optimizer", "airport-commute-calculator"],
        tasks: [
          "Calcolo tempi di coincidenza treni alta velocità (AVE / Chamartín)",
          "Pianificazione spostamenti confortevoli per passeggeri senior (70 anni)",
          "Selezione parcheggi aeroportuali a misura d'uomo (Ancona vs FCO)"
        ],
        stats: { routesOptimized: 18 }
      }
    ]
  }
];
