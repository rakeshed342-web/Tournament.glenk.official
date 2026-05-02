import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown,
  Users, 
  Calendar, 
  MessageSquare, 
  Send, 
  X, 
  ChevronRight, 
  Gamepad2, 
  Zap, 
  Shield, 
  Sword,
  Bot,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Settings,
  Coins,
  Ticket,
  CreditCard,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  User,
  QrCode,
  Gift,
  History,
  Plus,
  Trash2,
  Image as ImageIcon,
  Headset,
  Info,
  LineChart,
  Sliders,
  Palette,
  Layout,
  Maximize2,
  Minimize2,
  Type,
  Check,
  RotateCcw,
  Circle,
  Square,
  Maximize,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  LayoutDashboard,
  Search,
  Target,
  ArrowDownLeft,
  ArrowUpRight,
  UserPlus,
  UserCheck,
  UserMinus,
  Mail,
  Camera,
  PanelRight,
  MoreVertical,
  UserCog,
  Crosshair,
  MousePointer2,
  Trophy,
  ClipboardList,
  Sparkles,
  Upload,
  Twitter,
  Instagram,
  Youtube,
  Github,
  ShieldCheck
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import confetti from 'canvas-confetti';
import { io } from 'socket.io-client';

// --- Sound Effects ---
const hoverSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
const clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
const successSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
const bgMusic = new Audio('https://assets.mixkit.co/active_storage/sfx/133/133-preview.mp3');

export const audioSettings = {
  hover: localStorage.getItem('gt_audio_hover') !== 'false',
  click: localStorage.getItem('gt_audio_click') !== 'false',
  success: localStorage.getItem('gt_audio_success') !== 'false',
  music: localStorage.getItem('gt_audio_music') === 'true',
  masterVolume: parseFloat(localStorage.getItem('gt_audio_master') || '0.5'),
  musicVolume: parseFloat(localStorage.getItem('gt_audio_music_vol') || '0.15'),
  sfxVolume: parseFloat(localStorage.getItem('gt_audio_sfx_vol') || '0.5'),
};

const syncVolume = () => {
  const master = audioSettings.masterVolume;
  bgMusic.volume = audioSettings.musicVolume * master;
  hoverSound.volume = audioSettings.sfxVolume * master * 0.4;
  clickSound.volume = audioSettings.sfxVolume * master;
  successSound.volume = audioSettings.sfxVolume * master * 1.2;
};

syncVolume();
bgMusic.loop = true;

export const updateAudioSetting = (key: keyof typeof audioSettings, value: any) => {
  (audioSettings as any)[key] = value;
  localStorage.setItem(`gt_audio_${key}`, value.toString());
  
  if (key === 'music') {
    if (value) bgMusic.play().catch(() => {});
    else bgMusic.pause();
  }
  
  if (key.toString().toLowerCase().includes('volume')) {
    syncVolume();
  }
};

export const playHover = () => { if(audioSettings.hover) { hoverSound.currentTime = 0; hoverSound.play().catch(() => {}); } };
export const playClick = () => { if(audioSettings.click) { clickSound.currentTime = 0; clickSound.play().catch(() => {}); } };
export const playSuccess = () => { if(audioSettings.success) { successSound.currentTime = 0; successSound.play().catch(() => {}); } };

// --- Constants & Types ---

// const GEMINI_MODEL = "gemini-3-flash-preview";

interface Tournament {
  id: string;
  title: string;
  prize: string;
  date: string;
  slots: string;
  type: 'Solo' | 'Duo' | 'Squad';
  status: 'Open' | 'Full' | 'Ongoing';
  entryFee: number;
  image: string;
}

interface JoinRequest {
  id: string;
  playerName: string;
  gameId: string;
  phone?: string;
  email?: string;
  tournamentId: string;
  tournamentTitle: string;
  status: 'pending' | 'approved';
  roomId?: string;
  roomPass?: string;
  timestamp: number;
}

interface UserData {
  coins: number;
  redeemedCodes: string[];
  friends: Friend[];
  friendRequests: FriendRequest[];
}

interface SenseiData {
  name: string;
  bio: string;
  advice: string;
  avatar?: string;
}

interface AppSettings {
  primaryColor: string;
  secondaryColor: string;
  bgStyle: 'nebula' | 'solid' | 'grid';
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  uiDensity: 'compact' | 'normal' | 'relaxed';
  animationSpeed: number;
  glowIntensity: number;
  showParticles: boolean;
  glassOpacity: number;
  showHero: boolean;
  showTournaments: boolean;
  showLeaderboard: boolean;
  showStats: boolean;
  cardStyle: 'skeuo' | 'flat' | 'neon' | 'glass' | 'hue';
  navPosition: 'bottom' | 'top';
  textTransform: 'uppercase' | 'none';
  stickyHeader: boolean;
  showFooter: boolean;
  soundVolume: number;
  enableTilt: boolean;
  fontFamily: 'Inter' | 'JetBrains Mono' | 'Outfit' | 'Space Grotesk';
  headingEffect: 'glow' | 'edge-glow' | 'cool-glow' | 'blink' | 'rotating' | 'side-rotating' | 'none';
  theme: 'default' | 'minecraft' | 'fortnite' | 'bgmi' | 'cod' | 'freefire' | 'gta5' | 'gta6' | 'cyberpunk' | 'eldenring' | 'valorant' | 'apex' | 'doom' | 'lol' | 'hue-morphism' | 'glass-morphism';
  uiScale: 'half' | 'full';
}

interface Friend {
  uid: string;
  name: string;
  status: 'online' | 'offline';
}

interface FriendRequest {
  fromUid: string;
  fromName: string;
  timestamp: number;
}

const SPONSORS = [
  { name: "RED BULL", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_GmbH_logo.svg/1200px-Red_Bull_GmbH_logo.svg.png" },
  { name: "RAZER", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/40/Razer_snake_logo.svg/1200px-Razer_snake_logo.svg.png" },
  { name: "LOGITECH G", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Logitech_logo.svg/1200px-Logitech_logo.svg.png" },
  { name: "ASUS ROG", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Asus_ROG_logo.svg/1200px-Asus_ROG_logo.svg.png" },
];

interface AppNotification {
  id: string;
  type: 'tournament' | 'reward' | 'update' | 'alert' | 'friend_request' | 'invite';
  title: string;
  message: string;
  timestamp: number;
  data?: any;
}

const NotificationManager = ({ notifications, removeNotification }: { notifications: AppNotification[], removeNotification: (id: string) => void }) => {
  return (
    <div className={cn("fixed top-24 right-6 z-[1000] flex flex-col gap-4 pointer-events-none w-full max-w-sm")}>
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ x: 100, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.9 }}
            className="pointer-events-auto"
          >
            <div className="glass-dark border border-white/10 p-5 rounded-2xl shadow-2xl relative overflow-hidden group">
              {/* Scanline Effect */}
              <div className="absolute inset-0 animate-scanline pointer-events-none opacity-20" />
              
              <div className="flex gap-4 relative z-10">
                <div className={cn(
                  "p-3 rounded-xl skeuo-raised",
                  notif.type === 'tournament' ? "text-primary" : 
                  notif.type === 'reward' ? "text-yellow-500" : 
                  notif.type === 'friend_request' ? "text-primary" :
                  notif.type === 'invite' ? "text-primary" :
                  notif.type === 'alert' ? "text-red-500" : "text-primary"
                )}>
                  <IconWrapper>
                    {notif.type === 'tournament' ? (
                      <Crown className="w-5 h-5 icon-glow" />
                    ) : 
                     notif.type === 'reward' ? <Zap className="w-5 h-5" /> : 
                     notif.type === 'friend_request' ? <UserPlus className="w-5 h-5" /> :
                     notif.type === 'invite' ? <Mail className="w-5 h-5" /> :
                     notif.type === 'alert' ? <Shield className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </IconWrapper>
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{notif.type} SIGNATURE</h4>
                    <button 
                      onClick={() => removeNotification(notif.id)}
                      className="text-white/20 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">{notif.title}</h3>
                  <p className="text-[10px] text-white/40 leading-relaxed font-medium">{notif.message}</p>
                </div>
              </div>
              
              {/* Progress Timer Bar */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
                className="absolute bottom-0 left-0 h-0.5 bg-primary shadow-[0_0_10px_var(--color-primary)]"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- Animation Components ---

const AnimatedNumber = ({ value, prefix = "" }: { value: number | string, prefix?: string }) => {
  const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = numValue;
    if (start === end) return;

    let totalDuration = 1500;
    let incrementTime = Math.abs(Math.floor(totalDuration / end));
    if (incrementTime < 10) incrementTime = 10;

    const timer = setInterval(() => {
      start += Math.ceil(end / 100);
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [numValue]);

  return <span className="font-mono">{prefix}{displayValue.toLocaleString()}</span>;
};

const IconWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    whileHover={{ 
      scale: 1.25, 
      rotate: [0, -10, 10, -10, 10, 0],
      filter: "drop-shadow(0 0 12px var(--color-primary)) brightness(1.2)"
    }}
    whileTap={{ 
      scale: 0.85,
      rotate: 180,
      transition: { duration: 0.2 }
    }}
    animate={{ 
      y: [0, -3, 0],
      filter: [
        "drop-shadow(0 0 4px var(--color-primary))", 
        "drop-shadow(0 0 10px var(--color-primary))", 
        "drop-shadow(0 0 4px var(--color-primary))"
      ],
      transition: {
        y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
        filter: { repeat: Infinity, duration: 2, ease: "easeInOut" }
      }
    }}
    className={cn("flex items-center justify-center cursor-pointer relative group", className)}
  >
    {/* Tactical Edge Glow Pulse */}
    <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-40 transition-opacity rounded-full" />
    <div className="relative z-10">
      {children}
    </div>
  </motion.div>
);

const CoinWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    animate={{ 
      rotateY: [0, 360],
    }}
    transition={{ 
      duration: 3, 
      repeat: Infinity, 
      ease: "linear" 
    }}
    whileHover={{ scale: 1.3, filter: "brightness(1.5) drop-shadow(0 0 15px #eab308)" }}
    className={cn("flex items-center justify-center cursor-pointer", className)}
    style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
  >
    <motion.div
      animate={{ 
        y: [0, -2, 0],
      }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  </motion.div>
);

const RevealSection: React.FC<{ children: React.ReactNode, direction?: "up" | "down" | "left" | "right", delay?: number }> = ({ children, direction = "up", delay = 0 }) => {
  const directions = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

// --- Components ---

const Background = ({ settings }: { settings: AppSettings }) => {
  const isCyberpunk = settings.theme === 'cyberpunk';
  const isMinecraft = settings.theme === 'minecraft';
  const isValorant = settings.theme === 'valorant';
  const isHueMorphism = settings.theme === 'hue-morphism' || settings.cardStyle === 'hue';
  const isGlassMorphism = settings.theme === 'glass-morphism' || settings.cardStyle === 'glass';
  
  return (
    <div className="fixed inset-0 -z-30 bg-[#020202] overflow-hidden">
      {/* Dynamic Ambient Base Layer */}
      <motion.div 
        animate={{ 
          opacity: isHueMorphism ? [0.4, 0.7, 0.4] : [0.3, 0.5, 0.3],
          scale: isHueMorphism ? [1, 1.2, 1] : [1, 1.1, 1],
          filter: isHueMorphism ? ["hue-rotate(0deg)", "hue-rotate(360deg)"] : "none"
        }}
        transition={{ 
          duration: isHueMorphism ? 10 : 15, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className={cn(
          "absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--color-primary)_0%,transparent_70%)] opacity-20 blur-[100px]",
          isHueMorphism && "mix-blend-screen opacity-40"
        )}
      />

      {/* Grid Architecture */}
      <div 
        className={cn(
          "absolute inset-0 opacity-20 pointer-events-none transition-all duration-1000",
          isMinecraft ? "bg-grid-minecraft" : "bg-grid"
        )} 
        style={{ 
          filter: `drop-shadow(0 0 ${settings.glowIntensity * 2}px var(--color-primary))`,
          backgroundSize: settings.uiDensity === 'compact' ? '30px 30px' : '50px 50px'
        }}
      />

      {/* Glass Flow Layer */}
      {isGlassMorphism && (
        <div className="absolute inset-0 z-10 animate-glass-shimmer opacity-10 pointer-events-none" />
      )}

      {/* Dynamic Data Flow Lines */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`streamer-${i}`}
            initial={{ top: `${Math.random() * 100}%`, left: "-20%" }}
            animate={{ left: "120%" }}
            transition={{ 
              duration: 5 + Math.random() * 10, 
              repeat: Infinity, 
              delay: Math.random() * 20,
              ease: "linear"
            }}
            className={cn(
              "absolute h-px w-64 bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm",
              isHueMorphism && "h-[2px] opacity-60"
            )}
            style={isHueMorphism ? { filter: `hue-rotate(${i * 36}deg)` } : {}}
          />
        ))}
      </div>

      {/* Atmospheric Particles */}
      {settings.showParticles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              initial={{ 
                x: `${Math.random() * 100}%`, 
                y: `${Math.random() * 100}%`,
                scale: 0,
                opacity: 0
              }}
              animate={{ 
                y: [`${Math.random() * 100}%`, `${Math.random() * 100 - 20}%`],
                scale: [0, Math.random() * 1.5, 0],
                opacity: [0, 0.4, 0],
                x: [`${Math.random() * 100}%`, `${Math.random() * 100 + (Math.random() - 0.5) * 10}%`]
              }}
              transition={{ 
                duration: 10 + Math.random() * 20, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute w-1 h-1 bg-primary rounded-full blur-[1px]"
            />
          ))}
        </div>
      )}

      {/* High Fidelity Floating Orbs */}
      <div className="absolute inset-0">
        <motion.div 
          animate={{ 
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
            scale: [1, 1.2, 0.9, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -150, 100, 0],
            y: [0, 150, -100, 0],
            scale: [1, 0.8, 1.1, 1],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[150px]"
        />
      </div>

      {/* Cyberpunk Glitch Overlay */}
      {isCyberpunk && (
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-scanline opacity-20" />
          <motion.div 
            animate={{ opacity: [0, 0.1, 0] }}
            transition={{ duration: 0.1, repeat: Infinity, repeatDelay: Math.random() * 5 }}
            className="absolute inset-0 bg-red-500/5 mix-blend-color-dodge"
          />
        </div>
      )}

      {/* Valorant Geometric Elements */}
      {isValorant && (
         <div className="absolute inset-0 opacity-10 blur-[1px]">
           <div className="absolute top-20 right-20 w-32 h-32 border-2 border-primary rotate-45" />
           <div className="absolute bottom-40 left-40 w-48 h-48 border border-primary/50 rotate-12" />
         </div>
      )}

      {/* Professional Depth Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,transparent_0%,rgba(0,0,0,0.9)_100%)]" />
      
      {/* Scanline Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-white/5 rounded-xl", className)} />
);

const TournamentSkeleton = ({ settings }: { settings: AppSettings }) => {
  const effectiveStyle = settings.theme === 'hue-morphism' ? 'hue' : (settings.theme === 'glass-morphism' ? 'glass' : settings.cardStyle || 'skeuo');
  
  return (
    <div className={cn(
      "rounded-[1.5rem] p-4 md:p-6 border border-white/5 space-y-4 md:space-y-6 transition-all duration-700",
      effectiveStyle === 'skeuo' && "skeuo-raised",
      effectiveStyle === 'glass' && "glass-immersive",
      effectiveStyle === 'hue' && "hue-morphism",
      effectiveStyle === 'flat' && "bg-[#0a0a0f] border-white/10",
      effectiveStyle === 'neon' && "bg-black border-primary/20",
      !effectiveStyle && "glass-dark"
    )}>
      <Skeleton className="w-full h-48 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="w-3/4 h-7" />
        <div className="flex gap-2">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
      </div>
      <div className="h-px bg-white/5" />
      <div className="flex justify-between items-center pt-2">
        <div className="space-y-1">
          <Skeleton className="w-12 h-3" />
          <Skeleton className="w-20 h-6" />
        </div>
        <Skeleton className="w-28 h-12 rounded-[1.25rem]" />
      </div>
    </div>
  );
};

const LeaderboardSkeleton = ({ settings }: { settings: AppSettings }) => {
  const effectiveStyle = settings.theme === 'hue-morphism' ? 'hue' : (settings.theme === 'glass-morphism' ? 'glass' : settings.cardStyle || 'skeuo');

  return (
    <div className={cn(
      "rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl transition-all duration-700",
      effectiveStyle === 'skeuo' && "skeuo-raised",
      effectiveStyle === 'glass' && "glass-immersive",
      effectiveStyle === 'hue' && "hue-morphism",
      effectiveStyle === 'flat' && "bg-[#0a0a0f] border-white/10",
      effectiveStyle === 'neon' && "bg-black border-primary/20",
      !effectiveStyle && "glass-dark"
    )}>
      <div className="p-8 border-b border-white/5 bg-white/5 flex gap-4">
         <Skeleton className="w-16 h-4" />
         <Skeleton className="w-48 h-4" />
         <Skeleton className="w-16 h-4" />
         <Skeleton className="w-24 h-4 ml-auto" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-8 border-b border-white/5 flex items-center gap-6">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="w-48 h-6 rounded-lg" />
            <Skeleton className="w-32 h-3 rounded-md" />
          </div>
          <Skeleton className="w-16 h-8 rounded-xl ml-auto" />
        </div>
      ))}
    </div>
  );
};

const IntroAnimation = ({ onComplete, settings }: { onComplete: () => void, settings: AppSettings }) => {
  const [phase, setPhase] = useState<'loading' | 'intro' | 'system_init'>('loading');

  useEffect(() => {
    if (phase === 'loading') {
      const timer = setTimeout(() => {
        setPhase('intro');
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    if (phase === 'system_init') {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const handleEnterClick = () => {
    playClick();
    setPhase('system_init');
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[9999] bg-[#020202] flex flex-col items-center justify-center overflow-hidden"
      style={{ willChange: 'opacity' }}
    >
      <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex flex-col items-center"
            style={{ willChange: 'opacity' }}
          >
            <Crown className="w-20 h-20 mb-8 text-primary" />
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "linear" }}
                className="h-full bg-primary"
              />
            </div>
            <p className="mt-4 text-[8px] uppercase tracking-[0.4em] font-bold text-white/30">System Sync</p>
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 text-center flex flex-col items-center max-w-4xl px-6"
            style={{ willChange: 'opacity, transform' }}
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-8xl font-black tracking-tighter mb-4 uppercase text-white"
            >
              GLENK <span className="text-primary">GT</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs md:text-base text-white/50 mb-10 tracking-widest uppercase font-bold"
            >
              India's Most Loved Tournament Platform • 100% Made in India
            </motion.p>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEnterClick}
              className={cn(
                "skeuo-button bg-primary/10 px-8 md:px-12 py-4 rounded-xl font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-[10px] md:text-xs text-white border border-primary/20 hover:bg-primary/20 transition-all",
                settings.textTransform === 'uppercase' ? 'uppercase' : ''
              )}
            >
              <span>Join the Community</span>
            </motion.button>
          </motion.div>
        )}

        {phase === 'system_init' && (
          <motion.div
            key="system_init"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1 }}
            className="relative z-10 text-center flex flex-col items-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="mb-12"
            >
              <Crown className="w-16 h-16 text-primary" />
            </motion.div>
            
            <h1 className="text-3xl md:text-6xl font-black tracking-tighter flex gap-2">
              {"GLENK".split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
                  className={char === 'G' || char === 'K' ? "text-primary" : "text-white"}
                >
                  {char}
                </motion.span>
              ))}
            </h1>
            
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "200px", md: "300px", opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="h-1 bg-primary/30 mt-12 rounded-full relative max-w-[80vw]"
            >
              <motion.div 
                animate={{ left: ["0%", "100%", "0%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute top-0 bottom-0 w-20 bg-primary shadow-[0_0_15px_var(--color-primary)] rounded-full"
              />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 1 }}
              className="mt-12 text-lg md:text-2xl uppercase font-bold text-white/40 tracking-[0.2em] md:tracking-[0.5em]"
            >
              Ready for Combat
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5, duration: 1 }}
              className="mt-12 flex items-center gap-4 text-primary/50"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary drop-shadow-[0_0_10px_var(--color-primary)]" />
              <span className="text-sm font-bold tracking-[0.2em] uppercase">Booting Core Modules...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Navbar = ({ coins, avatar, onAddMoney, onRedeem, onProfileClick, onAudioClick, onSettingsClick }: { 
  coins: number, 
  avatar?: string,
  onAddMoney: () => void,
  onRedeem: () => void,
  onProfileClick: () => void,
  onAudioClick: () => void,
  onSettingsClick: () => void,
}) => {
  const [showCoinActions, setShowCoinActions] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] glass-dark border-b border-white/10 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => { playClick(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onMouseEnter={playHover}
            >
              <IconWrapper className="w-10 h-10 skeuo-raised rounded-xl transition-transform group-hover:box-glow flex items-center justify-center">
                <Crown className="text-primary w-5 h-5 icon-glow" />
              </IconWrapper>
              <span className="text-xl md:text-2xl font-black tracking-tighter hidden sm:block animate-text-shimmer">GLENK <span className="text-primary drop-shadow-[0_0_10px_var(--color-primary)]">GT</span></span>
            </motion.div>

            {/* Settings Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={playHover}
              onClick={() => { playClick(); onSettingsClick(); }}
              className="p-2 sm:p-2.5 skeuo-button rounded-lg sm:rounded-xl text-white/40 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary transition-all group"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-500" />
            </motion.button>

            {/* Profile Button Next to Logo */}
            <motion.button
              id="nav-profile"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={playHover}
              onClick={() => { playClick(); onProfileClick(); }}
              className="p-2 sm:p-2.5 skeuo-button rounded-lg sm:rounded-xl text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] overflow-hidden"
            >
              {avatar ? (
                <img src={avatar} alt="P" className="w-4 h-4 sm:w-5 sm:h-5 object-cover rounded-md" referrerPolicy="no-referrer" />
              ) : (
                <IconWrapper>
                  <User className="w-4 h-4 sm:w-5 sm:h-5 icon-glow" />
                </IconWrapper>
              )}
            </motion.button>
          </div>

          <div className="relative">
            <motion.button 
              id="nav-credits"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { playClick(); setShowCoinActions(!showCoinActions); }}
              className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 skeuo-pressed cursor-pointer"
            >
              <CoinWrapper>
                <Coins className="w-3.5 h-3.5 text-yellow-500" />
              </CoinWrapper>
              <span className="text-xs font-mono font-bold text-white/90">
                <AnimatedNumber value={coins} />
              </span>
            </motion.button>

            <AnimatePresence>
              {showCoinActions && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.8 }}
                  className="absolute top-full mt-3 left-0 flex flex-col gap-2 bg-[#020202]/95 backdrop-blur-2xl border border-white/10 p-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[101] min-w-[140px]"
                >
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Your G-Coins</span>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { playClick(); setShowCoinActions(false); }}
                      className="p-1 text-white/40 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={playHover}
                    onClick={() => { playClick(); onAddMoney(); setShowCoinActions(false); }}
                    className="text-[10px] w-full font-black uppercase tracking-widest text-primary hover:text-primary transition-colors skeuo-button laser-border bg-gradient-animate px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between group"
                  >
                    <span>Deposit</span>
                    <ArrowDownLeft className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={playHover}
                    onClick={() => { playClick(); onRedeem(); setShowCoinActions(false); }}
                    className="text-[10px] w-full font-black uppercase tracking-widest text-green-500 hover:text-green-400 transition-colors skeuo-button laser-border bg-gradient-animate px-4 py-3 rounded-xl border border-green-500/20 bg-green-500/5 flex items-center justify-between group"
                  >
                    <span>Redeem</span>
                    <ArrowUpRight className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-8 text-xs font-black tracking-[0.2em] uppercase text-white/40">
            {['Home', 'Tournaments', 'Leaderboard'].map((item) => (
              <motion.a
                key={`nav-${item}`}
                href={`#${item.toLowerCase()}`}
                whileHover={{ color: '#00f0ff', scale: 1.05 }}
                onMouseEnter={playHover}
                onClick={playClick}
                className="transition-all hover:text-glow px-2 py-1"
              >
                {item}
              </motion.a>
            ))}
            <div className="w-px h-4 bg-white/10" />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={playHover}
              onClick={() => { playClick(); onAudioClick(); }}
              className="p-2 skeuo-button rounded-xl transition-all border border-transparent hover:border-primary/20 text-white/30 hover:text-primary"
            >
              <IconWrapper>
                <Volume2 className="w-4 h-4" />
              </IconWrapper>
            </motion.button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-px h-4 bg-white/10 hidden md:block" />
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={playHover}
              onClick={() => { playClick(); document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="skeuo-button bg-primary/20 bg-gradient-animate px-4 md:px-6 py-3 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase text-white border border-primary/20 flex items-center gap-2 group"
            >
              <IconWrapper>
                <Gamepad2 className="w-4 h-4 text-primary group-hover:animate-pulse" />
              </IconWrapper>
              <span className="hidden sm:inline">Live Events</span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
};


const THEME_COLORS = [
  { name: 'Cyan (Default)', value: '#00f0ff' },
  { name: 'Neon Pink', value: '#ff0055' },
  { name: 'Bio Green', value: '#00ff88' },
  { name: 'Warning Orange', value: '#ff8800' },
  { name: 'Purple Void', value: '#b000ff' },
];

const THEME_FONTS = [
  { name: 'Revamped', value: '"Revamped"' },
  { name: 'Vampire Wars', value: '"Vampire Wars"' },
  { name: 'God Of War', value: '"God Of War"' },
  { name: 'Inter', value: '"Inter"' },
];

const getEffectClass = (effect: string) => {
  switch (effect) {
    case 'glow': return 'text-glow';
    case 'edge-glow': return 'text-edge-glow';
    case 'cool-glow': return 'text-cool-glow';
    case 'blink': return 'text-blink-glow';
    case 'rotating': return 'text-rotating-strip';
    case 'side-rotating': return 'text-side-rotating-strip';
    default: return '';
  }
};

const EffectText = ({ children, effect, className }: { children: React.ReactNode, effect: string, className?: string }) => {
  if (!effect || effect === 'none') return <span className={className}>{children}</span>;
  return (
    <span className={cn(getEffectClass(effect), className)}>
      {children}
    </span>
  );
};

const AudioSettingsModal = ({ onClose, currentSettings, updateSetting, settings }: { 
  onClose: () => void, 
  currentSettings: typeof audioSettings, 
  updateSetting: (key: keyof typeof audioSettings, value: any) => void,
  settings: AppSettings
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 md:p-6 backdrop-blur-2xl"
    >
      <motion.div 
        initial={{ 
          scale: settings.uiScale === 'half' ? 0.95 : 1, 
          opacity: 0, 
          x: settings.uiScale === 'half' ? 100 : 0 
        }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ 
          scale: settings.uiScale === 'half' ? 0.95 : 1, 
          opacity: 0, 
          x: settings.uiScale === 'half' ? 100 : 0 
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "glass-dark border border-white/5 flex flex-col relative overflow-y-auto shadow-2xl scrollbar-hide p-10 transition-all duration-300",
          settings.uiScale === 'half' 
            ? "fixed top-0 right-0 h-full w-full max-w-lg border-l rounded-none" 
            : "fixed inset-0 w-full h-full rounded-none"
        )}
      >
        <button onClick={onClose} className="absolute top-6 right-6 skeuo-raised p-2 rounded-xl text-white/40 hover:text-white hover:text-glow transition-all">
          <IconWrapper>
            <X className="w-5 h-5" />
          </IconWrapper>
        </button>
        
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Acoustic <span className="text-primary text-glow">Mixer</span></h2>
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/30 mb-8">Configure your auditory feed</p>

        <div className="space-y-6">
          {/* Master Volume */}
          <div className="space-y-3 p-4 skeuo-raised bg-black/20 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3 h-3" />
                <span>Master Volume</span>
              </div>
              <span className="text-primary">{(currentSettings.masterVolume * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.01" 
              value={currentSettings.masterVolume}
              onChange={(e) => updateSetting('masterVolume', parseFloat(e.target.value))}
              className="w-full accent-primary h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'music', label: 'Background Score', icon: Volume2, volKey: 'musicVolume' as const },
              { id: 'hover', label: 'Haptic Hover', icon: Zap },
              { id: 'click', label: 'Tactile Click', icon: MousePointer2 },
              { id: 'success', label: 'Achievement Alert', icon: CheckCircle2 }
            ].map((setting) => (
              <div key={setting.id} className="space-y-4 p-5 skeuo-raised bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-white">
                    <IconWrapper>
                      <setting.icon className={cn("w-5 h-5", currentSettings[setting.id as keyof typeof audioSettings] ? "text-primary" : "text-white/20")} />
                    </IconWrapper>
                    <span className="text-sm font-black uppercase tracking-widest">{setting.label}</span>
                  </div>
                  <button
                    onClick={() => { playClick(); updateSetting(setting.id as keyof typeof audioSettings, !currentSettings[setting.id as keyof typeof audioSettings]); }}
                    className={cn(
                      "relative w-12 h-7 rounded-full transition-colors duration-300 pointer-events-auto",
                      currentSettings[setting.id as keyof typeof audioSettings] ? "bg-primary/20 border border-primary/50" : "bg-white/5 border border-white/10"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 left-1 w-5 h-5 rounded-full transition-all duration-300 shadow-md",
                      currentSettings[setting.id as keyof typeof audioSettings] ? "bg-primary translate-x-5" : "bg-white/30 translate-x-0"
                    )} />
                  </button>
                </div>

                {setting.id === 'music' && (
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
                      <span>Music Gain</span>
                      <span>{(currentSettings.musicVolume * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="0.5" step="0.01" 
                      value={currentSettings.musicVolume}
                      onChange={(e) => updateSetting('musicVolume', parseFloat(e.target.value))}
                      className="w-full accent-primary h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                )}
                
                {setting.id === 'hover' && (
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
                      <span>SFX Gain</span>
                      <span>{(currentSettings.sfxVolume * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01" 
                      value={currentSettings.sfxVolume}
                      onChange={(e) => updateSetting('sfxVolume', parseFloat(e.target.value))}
                      className="w-full accent-primary h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const RedeemModal = ({ onClose, onSuccess, userId, settings }: { onClose: () => void, onSuccess: (coins: number) => void, userId: string, settings: AppSettings }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!code) throw new Error("Vector code not provided");
      const res = await fetch('/api/user/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code })
      });
      if (!res.ok) throw new Error("Network latency during decryption");
      const data = await res.json();
      if (data.success) {
        onSuccess(data.coins);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00f0ff', '#ffffff'] });
        onClose();
      } else {
        setError(data.error || "Decryption Failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to redeem code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/95 p-4 md:p-6 backdrop-blur-2xl"
    >
      <motion.div 
        initial={{ 
          scale: settings.uiScale === 'half' ? 1 : 0.9, 
          x: settings.uiScale === 'half' ? -100 : 0, 
          opacity: 0 
        }}
        animate={{ scale: 1, x: 0, opacity: 1 }}
        exit={{ 
          scale: settings.uiScale === 'half' ? 1 : 0.95, 
          x: settings.uiScale === 'half' ? -100 : 0, 
          opacity: 0 
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "glass-dark border border-white/5 flex flex-col relative overflow-y-auto shadow-2xl scrollbar-hide p-10 transition-all duration-300",
          settings.uiScale === 'half' 
            ? "fixed top-0 left-0 h-full w-full max-w-lg border-r rounded-none" 
            : "fixed inset-0 w-full h-full rounded-none"
        )}
      >
        <button onClick={onClose} className="absolute top-8 right-8 skeuo-raised p-2 rounded-xl text-white/20 hover:text-white">
          <IconWrapper>
            <X className="w-5 h-5" />
          </IconWrapper>
        </button>

        <div className="text-center space-y-10">
          <div className="w-20 h-20 skeuo-raised rounded-3xl flex items-center justify-center mx-auto mb-4">
            <IconWrapper>
              <Ticket className="w-10 h-10 text-primary" />
            </IconWrapper>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Code <span className="text-primary text-glow">Injection</span></h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Decrypt and verify secret tokens</p>
          </div>

          <form onSubmit={handleRedeem} className="space-y-6">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ENTER VECTOR"
              className="w-full bg-[#050505] border border-white/5 rounded-2xl px-6 py-5 text-center font-mono tracking-[0.4em] font-black focus:outline-none focus:border-primary/50 transition-all skeuo-pressed"
            />
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-primary text-[9px] font-black uppercase tracking-widest text-center"
              >
                {error}
              </motion.p>
            )}
            <button 
              disabled={loading} 
              type="submit" 
              className="w-full skeuo-button bg-gradient-animate py-5 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all border border-white/10"
            >
              <span>{loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary drop-shadow-[0_0_10px_var(--color-primary)]" /> : 'Execute Sequence'}</span>
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AddMoneyModal = ({ onClose, userId, settings }: { onClose: () => void, userId: string, settings: AppSettings }) => {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [proof, setProof] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!email || !amount || !proof) throw new Error("Incomplete transmission log");
      const res = await fetch('/api/user/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, amount, proof })
      });
      if (!res.ok) throw new Error("Network disruption detected");
      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#ffffff', '#7000ff']
        });
        setStep(3);
      } else {
        setError(data.error || "Deposit Failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown Transmission Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/95 p-4 md:p-6 backdrop-blur-2xl"
    >
      <motion.div 
        initial={{ 
          scale: settings.uiScale === 'half' ? 1 : 0.9, 
          x: settings.uiScale === 'half' ? -100 : 0, 
          opacity: 0 
        }}
        animate={{ scale: 1, x: 0, opacity: 1 }}
        exit={{ 
          scale: settings.uiScale === 'half' ? 1 : 0.95, 
          x: settings.uiScale === 'half' ? -100 : 0, 
          opacity: 0 
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "glass-dark border border-white/5 flex flex-col relative overflow-y-auto shadow-2xl scrollbar-hide p-10 transition-all duration-300",
          settings.uiScale === 'half' 
            ? "fixed top-0 left-0 h-full w-full max-w-lg border-r rounded-none" 
            : "fixed inset-0 w-full h-full rounded-none"
        )}
      >
        <button onClick={onClose} className="absolute top-6 right-6 skeuo-raised p-2 rounded-xl text-white/20 hover:text-white z-10">
          <IconWrapper>
            <X className="w-5 h-5" />
          </IconWrapper>
        </button>

        <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10 text-center">
            <div className="w-20 h-20 skeuo-raised rounded-3xl flex items-center justify-center mx-auto">
              <IconWrapper>
                <QrCode className="w-10 h-10 text-primary" />
              </IconWrapper>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Acquire <span className="text-primary">Credits</span></h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Secure Financial Uplink</p>
            </div>
            
            <div className="p-8 skeuo-raised rounded-3xl bg-white/5 border border-white/5 inline-block mx-auto group">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=dasjogeshkumar-1@okaxis&pn=Jogesh%20Das&am=0&cu=INR" 
                alt="Payment QR"
                className="w-48 h-48 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="space-y-6">
              <div className="skeuo-pressed p-6 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Network Endpoint (UPI)</p>
                <p className="text-lg font-mono font-black text-primary tracking-widest break-all">dasjogeshkumar-1@okaxis</p>
              </div>
              
              <button 
                onClick={() => setStep(2)}
                className="w-full skeuo-button bg-gradient-animate py-5 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all border border-white/10"
              >
                <span>Broadcast Deposit Proof</span>
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.form key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSubmit} className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Transmission <span className="text-primary text-glow">Logs</span></h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Validate your transaction</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Gmail Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="USER@DOMAIN.COM"
                  className="w-full bg-[#050505] border border-white/5 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all font-mono skeuo-pressed text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Credit Amount</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#050505] border border-white/5 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all font-mono skeuo-pressed text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Proof Link / TXN ID</label>
                <textarea
                  required
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  placeholder="PASTE EVIDENCE HERE"
                  className="w-full bg-[#050505] border border-white/5 rounded-2xl px-6 py-4 h-28 focus:outline-none focus:border-primary/50 transition-all font-mono skeuo-pressed text-sm resize-none"
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-primary text-[9px] font-black uppercase tracking-widest text-center"
              >
                {error}
              </motion.p>
            )}

            <button 
              disabled={loading} 
              type="submit" 
              className="w-full skeuo-button bg-gradient-animate py-5 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all border border-white/10"
            >
              <span>{loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary drop-shadow-[0_0_10px_var(--color-primary)]" /> : 'Finalize Sync'}</span>
            </button>
          </motion.form>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10 py-10">
            <div className="w-24 h-24 skeuo-raised rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <IconWrapper>
                <CheckCircle2 className="w-12 h-12 text-green-500 icon-glow" />
              </IconWrapper>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Ticket <span className="text-primary">Secured</span></h2>
              <p className="text-xs text-white/40 font-black uppercase tracking-widest leading-relaxed">Verification process initiated.<br/>Credits will reflect in 2-4 hours.</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-full skeuo-raised py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:text-primary transition-all text-white/40"
            >
              Close and Exit App
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const ProfileModal = ({ 
  name, 
  avatar,
  tags = [],
  points, 
  uid, 
  history = [],
  achievements = [],
  onClose, 
  isOwnProfile = true, 
  onAddFriend, 
  onInvite,
  friends = [],
  friendRequests = [],
  onAcceptFriend,
  onRejectFriend,
  onRemoveFriend,
  onUpdateProfile,
  sensei,
  settings: appSettings
}: { 
  name: string, 
  avatar?: string,
  tags?: string[],
  sensei?: SenseiData | null,
  points: number, 
  uid: string, 
  history?: any[],
  achievements?: any[],
  onClose: () => void,
  isOwnProfile?: boolean,
  onAddFriend?: (uid: string, name: string) => void,
  onInvite?: (uid: string, name: string) => void,
  friends?: Friend[],
  friendRequests?: FriendRequest[],
  onAcceptFriend?: (req: FriendRequest) => void,
  onRejectFriend?: (req: FriendRequest) => void,
  onRemoveFriend?: (uid: string) => void,
  onUpdateProfile?: (updates: { name?: string, avatar?: string, tags?: string[], sensei?: SenseiData }) => Promise<void>,
  settings: AppSettings
}) => {
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'profile' | 'friends' | 'history' | 'achievements' | 'sensei'>('profile');
  const [requestSent, setRequestSent] = useState(false);
  const [searchUid, setSearchUid] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNameValue, setEditNameValue] = useState(name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [availableTags] = useState(['Slayer', 'Tactician', 'Lone Wolf', 'Sniper', 'Rusher', 'MVP', 'Ghost', 'Healer']);
  const [selectedTags, setSelectedTags] = useState<string[]>(tags);

  const handleProfileSave = async () => {
    setIsUpdating(true);
    if (onUpdateProfile) {
      await onUpdateProfile({ 
        name: editNameValue !== name ? editNameValue : undefined,
        tags: selectedTags 
      });
    }
    setIsUpdating(false);
    setIsEditingProfile(false);
  };

  const compressImage = (base64Str: string, maxWidth = 512, maxHeight = 512): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateProfile) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit check
        alert("Image too large. Please select a file smaller than 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        setIsUpdating(true);
        try {
          const compressed = await compressImage(reader.result as string);
          await onUpdateProfile({ avatar: compressed });
        } catch (err) {
          console.error("Upload error:", err);
          alert("Network disruption or upload failure. Please try again.");
        } finally {
          setIsUpdating(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiAvatarGen = async () => {
    if (!aiPrompt) return;
    setIsUpdating(true);
    try {
      const seed = encodeURIComponent(aiPrompt);
      const newAvatar = `https://pollinations.ai/p/${seed}?width=512&height=512&seed=${Math.random()}`;
      if (onUpdateProfile) {
        await onUpdateProfile({ avatar: newAvatar });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
      setAiPrompt('');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag].slice(0, 3)
    );
  };

  const handleGenerateSensei = async () => {
    setIsUpdating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Generate a gaming sensei/mentor persona for a player named ${name} who has the tags: ${tags.join(', ')}. 
      Return a JSON object with:
      {
        "name": "Cool Sensei Name",
        "bio": "A brief background of this sensei in a futuristic/cyberpunk setting",
        "advice": "One piece of high-level tactical advice for the player based on their tags"
      }
      Do not include any markdown formatting, just the raw JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const senseiData = JSON.parse(response.text);
      // Add a randomized avatar using a robotic style
      senseiData.avatar = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${senseiData.name}`;

      if (onUpdateProfile) {
        await onUpdateProfile({ sensei: senseiData });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 300); 
    const timer2 = setTimeout(() => setStep(2), 800); 
    const timer3 = setTimeout(() => setStep(3), 1300); 
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <motion.div
      initial={{ 
        opacity: 0,
        x: appSettings?.uiScale === 'half' ? 100 : 0,
        scale: appSettings?.uiScale === 'half' ? 1 : 1.1
      }}
      animate={{ 
        opacity: 1,
        x: 0,
        scale: 1
      }}
      exit={{ 
        opacity: 0,
        x: appSettings?.uiScale === 'half' ? 100 : 0,
        scale: appSettings?.uiScale === 'half' ? 1 : 0.95
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "fixed z-[10000] bg-[#0F0F1A]/95 border-l border-white/10 shadow-2xl backdrop-blur-xl transition-all duration-500 overflow-y-auto scrollbar-hide",
        appSettings?.uiScale === 'half' 
          ? "top-0 right-0 h-full w-full max-w-lg" 
          : "inset-0 w-full h-full"
      )}
    >
      <div className={cn(
        "relative flex flex-col p-6 md:p-12 min-h-full",
        appSettings?.uiScale === 'full' ? "max-w-4xl mx-auto" : ""
      )}>
        <div className="flex justify-between items-start mb-8 relative z-10 w-full min-h-[48px]">
          {isOwnProfile && (
            <div className="flex flex-wrap gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 w-fit">
              <button 
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'profile' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                )}
              >
                Profile
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'history' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                )}
              >
                History
              </button>
              <button 
                onClick={() => setActiveTab('achievements')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'achievements' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                )}
              >
                Awards
              </button>
              <button 
                onClick={() => setActiveTab('sensei')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'sensei' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                )}
              >
                Sensei
              </button>
              <button 
                onClick={() => setActiveTab('friends')}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  activeTab === 'friends' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                )}
              >
                Friends
                {friendRequests.length > 0 && (
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </button>
            </div>
          )}
          <button 
            onClick={() => { playClick(); onClose(); }} 
            className="skeuo-raised p-3 rounded-2xl text-white/20 hover:text-white transition-colors ml-auto"
          >
            <IconWrapper>
              <X className="w-5 h-5" />
            </IconWrapper>
          </button>
        </div>

        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10 pointer-events-none opacity-50" />

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' ? (
              <motion.div 
                key="profile-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center space-y-12"
              >
                <div className="w-full space-y-10">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-8">
                    <div className="w-40 h-40 skeuo-raised rounded-[3rem] relative group border border-white/5 p-1">
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity animate-pulse rounded-full" />
                      <div className="relative w-full h-full rounded-[2.8rem] overflow-hidden skeuo-pressed">
                        <img 
                          src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} 
                          alt={name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isOwnProfile && isEditingProfile && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer p-4 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-all">
                              <Upload className="w-6 h-6" />
                              <input 
                                id="profile-upload-file"
                                type="file" 
                                accept="image/*"
                                className="hidden" 
                                onChange={handleFileUpload} 
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isOwnProfile && isEditingProfile && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-sm space-y-4"
                      >
                        <div className="space-y-4">
                          <div className="space-y-2">
                             <p className="text-[10px] text-white/20 uppercase tracking-[0.5em] font-black text-center">Tournament Guide</p>
                             <div className="flex gap-2">
                               <input 
                                 type="text" 
                                 placeholder="Describe your combat avatar..."
                                 value={aiPrompt}
                                 onChange={(e) => setAiPrompt(e.target.value)}
                                 className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-primary/50"
                               />
                               <button 
                                 onClick={handleAiAvatarGen}
                                 disabled={isUpdating || !aiPrompt}
                                 className="skeuo-button p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary skeuo-raised"
                               >
                                 {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                               </button>
                             </div>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[8px] uppercase tracking-[0.3em] font-black">
                              <span className="bg-black/80 px-4 text-white/10 italic">Secure Uplink Alternative</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              const input = document.getElementById('profile-upload-file');
                              if (input) input.click();
                            }}
                            className="w-full skeuo-button py-4 bg-white/5 border border-white/10 rounded-xl text-white/60 text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-3 hover:text-primary transition-all group"
                          >
                            <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Upload Physical Capture
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Name & Tags Section */}
                  <div className="space-y-10">
                    <div className="text-center space-y-6">
                       {isEditingProfile ? (
                         <div className="max-w-xs mx-auto space-y-3">
                           <p className="text-[10px] text-white/20 uppercase tracking-[0.5em] font-black">Codename Update</p>
                           <input 
                              type="text" 
                              value={editNameValue}
                              onChange={(e) => setEditNameValue(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center text-2xl font-black uppercase tracking-tight text-white focus:outline-none focus:border-primary/50 skeuo-pressed"
                           />
                         </div>
                       ) : (
                         <div className="space-y-3">
                            <p className="text-[10px] text-white/20 uppercase tracking-[0.5em] font-black">Combatant Identity</p>
                            <h3 className="text-5xl font-black tracking-tighter text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{name}</h3>
                         </div>
                       )}

                       {/* Tags */}
                       <div className="flex flex-wrap justify-center gap-3">
                          {(isEditingProfile ? availableTags : selectedTags).map(tag => (
                            <motion.button
                              key={tag}
                              whileHover={isEditingProfile ? { scale: 1.05 } : {}}
                              whileTap={isEditingProfile ? { scale: 0.95 } : {}}
                              onClick={() => isEditingProfile && toggleTag(tag)}
                              className={cn(
                                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                                selectedTags.includes(tag) 
                                  ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]" 
                                  : "bg-white/5 border-white/10 text-white/20"
                              )}
                            >
                              {tag}
                            </motion.button>
                          ))}
                       </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 skeuo-pressed flex flex-col items-center justify-center space-y-2">
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.5em] font-black">Aggregated Power</p>
                        <div className="flex items-center gap-3">
                          <Coins className="w-5 h-5 text-yellow-500" />
                          <span className="text-3xl font-black text-primary text-glow"><AnimatedNumber value={points} /></span>
                        </div>
                      </div>

                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 skeuo-pressed flex flex-col items-center justify-center space-y-2 group cursor-help">
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.5em] font-black">Network Signature</p>
                        <span className="text-[10px] font-mono font-black text-white/30 group-hover:text-primary transition-colors uppercase tracking-widest">{uid}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isOwnProfile && (
                      <div className="flex justify-center pt-8">
                        {isEditingProfile ? (
                          <div className="flex gap-6 w-full max-w-md">
                            <button 
                              onClick={() => { setIsEditingProfile(false); setSelectedTags(tags); setEditNameValue(name); }}
                              className="flex-1 skeuo-button py-5 rounded-2xl bg-white/5 border border-white/10 text-white/30 font-black uppercase tracking-widest text-[10px]"
                            >
                              Discard
                            </button>
                            <button 
                              onClick={handleProfileSave}
                              className="flex-1 skeuo-button bg-gradient-animate bg-primary/10 border border-primary/30 text-primary py-5 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                            >
                              <span>Commit Changes</span>
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setIsEditingProfile(true)}
                            className="px-12 py-5 skeuo-button border border-white/5 rounded-2xl text-white/40 hover:text-primary font-black uppercase tracking-widest text-[11px] flex items-center gap-4 skeuo-raised"
                          >
                            <UserCog className="w-5 h-5" />
                            Save Changes
                          </button>
                        )}
                      </div>
                    )}

                    {!isOwnProfile && (
                      <div className="flex flex-wrap gap-4 pt-4 justify-center">
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={requestSent}
                          onClick={() => {
                            playClick();
                            setRequestSent(true);
                            onAddFriend?.(uid, name);
                          }}
                          className={cn(
                            "flex-1 min-w-[200px] py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] border flex items-center justify-center gap-3 transition-all",
                            requestSent 
                              ? "bg-white/5 border-white/10 text-white/20 opacity-50" 
                              : "skeuo-button bg-gradient-animate bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                          )}
                        >
                          <span><UserPlus className="w-4 h-4 inline-block mr-2" />
                          {requestSent ? "Uplink Requested" : "Sync Combatant"}</span>
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'sensei' ? (
              <motion.div 
                key="sensei-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="text-center space-y-4">
                  <p className="text-[10px] text-white/20 uppercase tracking-[0.5em] font-black">Helpful Assistant</p>
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic">Tactical <span className="text-primary">Sensei</span></h2>
                </div>

                <AnimatePresence mode="wait">
                  {sensei ? (
                    <motion.div 
                      key="sensei-display"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/5 shadow-xl skeuo-raised relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-24 h-24 rounded-3xl skeuo-pressed flex-shrink-0 overflow-hidden p-1 border border-primary/20">
                          <img 
                            src={sensei.avatar} 
                            alt={sensei.name} 
                            className="w-full h-full object-cover rounded-2xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-2 relative z-10">
                          <h4 className="text-xl font-black text-primary uppercase tracking-tight">{sensei.name}</h4>
                          <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest italic">{sensei.bio}</p>
                        </div>
                      </div>

                      <div className="bg-primary/10 border border-primary/20 p-8 rounded-[2.5rem] relative group skeuo-pressed">
                        <div className="absolute -top-4 left-8 bg-black border border-primary/30 px-4 py-1.5 rounded-full">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Master's Insight</p>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed font-medium italic">
                          "{sensei.advice}"
                        </p>
                        <Bot className="absolute -bottom-4 -right-4 w-12 h-12 text-primary opacity-20 group-hover:opacity-40 transition-opacity rotate-12" />
                      </div>

                      {isOwnProfile && (
                        <div className="flex justify-center">
                          <button 
                            onClick={handleGenerateSensei}
                            disabled={isUpdating}
                            className="text-[10px] text-white/20 hover:text-primary font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" /> Reset Assistant
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="sensei-init"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center space-y-8 py-10"
                    >
                      <div className="w-32 h-32 skeuo-raised rounded-[2.5rem] flex items-center justify-center relative group opacity-50">
                        <Bot className="w-16 h-16 text-white/20" />
                        <div className="absolute inset-0 border-2 border-white/5 rounded-[2.5rem] animate-ping opacity-20" />
                      </div>
                      
                      <div className="text-center space-y-6 max-w-sm">
                        <h4 className="text-lg font-black text-white/40 uppercase tracking-widest">No Mentor Detected</h4>
                        <p className="text-xs text-white/20 leading-relaxed font-black uppercase tracking-widest px-4">
                          Your tactical performance requires an AI mentor for advanced strategy synthesis.
                        </p>
                      </div>

                      {isOwnProfile && (
                        <button 
                          onClick={handleGenerateSensei}
                          disabled={isUpdating}
                          className="px-12 py-5 skeuo-button bg-primary/10 border border-primary/20 rounded-2xl text-primary font-black uppercase tracking-widest text-[11px] flex items-center gap-4 skeuo-raised group"
                        >
                          {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                          Synthesize Sensei
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : activeTab === 'history' ? (
              <motion.div 
                key="history-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 min-h-[400px]"
              >
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Deployment Logs</h4>
                {history.length === 0 ? (
                  <div className="p-12 text-center skeuo-pressed rounded-3xl border border-white/5 animate-pulse">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">No deployments found</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {history.map((item, idx) => (
                      <div key={idx} className="glass-dark border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-primary/20 transition-all">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-black text-white uppercase tracking-tight">{item.title}</p>
                          <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">{item.date}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", item.result === 'COMPLETED' ? "text-primary border-primary/20 bg-primary/10" : "text-white/40 border-white/10 bg-white/5")}>
                            {item.result}
                          </span>
                          <span className="text-xs font-black text-yellow-500">+{item.points} PTS</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'achievements' ? (
              <motion.div 
                key="achievements-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 min-h-[400px]"
              >
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Tactical Accolades</h4>
                {achievements.length === 0 ? (
                  <div className="p-12 text-center skeuo-pressed rounded-3xl border border-white/5 animate-pulse">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Awaiting combat verification</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((acc, idx) => {
                      let IconComponent = Target;
                      let RarityColor = "text-white/80 bg-white/5 border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]";
                      let RarityLabel = "COMMON";
                      let IconColor = "text-white/60";

                      if (acc.icon === 'sword') IconComponent = Sword;
                      if (acc.icon === 'shield') IconComponent = Shield;
                      if (acc.icon === 'crosshair') IconComponent = Crosshair;
                      if (acc.icon === 'crown') {
                        return (
                          <div key={idx} className={cn("p-6 rounded-3xl border transition-all group overflow-hidden relative", RarityColor)}>
                            <div className="relative z-10 flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                <div className={cn("p-3 rounded-2xl bg-white/5", IconColor)}>
                                  <Crown className="w-6 h-6 text-primary icon-glow" />
                                </div>
                                <span className="text-[10px] font-black tracking-widest">{RarityLabel}</span>
                              </div>
                              <div>
                                <h5 className="font-black uppercase tracking-tight text-white mb-1 group-hover:text-primary transition-colors">{acc.title}</h5>
                                <p className="text-xs text-white/40 leading-relaxed font-medium capitalize">{acc.desc}</p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (acc.rarity === 'rare') {
                        RarityColor = "text-primary/90 bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:border-primary/50 hover:shadow-[0_0_25px_rgba(0,240,255,0.2)]";
                        RarityLabel = "RARE";
                        IconColor = "text-primary";
                      } else if (acc.rarity === 'epic') {
                        RarityColor = "text-purple-400 bg-purple-500/5 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]";
                        RarityLabel = "EPIC";
                        IconColor = "text-purple-400";
                      } else if (acc.rarity === 'legendary') {
                        RarityColor = "text-yellow-400 bg-yellow-400/5 border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.1)] hover:border-yellow-400/50 hover:shadow-[0_0_25px_rgba(250,204,21,0.2)]";
                        RarityLabel = "LEGENDARY";
                        IconColor = "text-yellow-400";
                      } else if (acc.rarity === 'common') {
                        RarityColor = "text-white/80 bg-white/5 border-white/10 hover:border-white/20";
                      }

                      return (
                        <div key={idx} className={cn("p-4 rounded-3xl flex flex-col gap-3 group transition-all duration-500 border skeuo-pressed relative overflow-hidden", RarityColor)}>
                          <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40", RarityColor.split(" ")[0].replace("text-", "bg-"))} />
                          <div className="flex justify-between items-start">
                            <div className={cn("w-12 h-12 skeuo-raised rounded-2xl flex items-center justify-center relative", RarityColor.split(" ")[1])}>
                              <IconComponent className={cn("w-6 h-6 transition-all duration-300 group-hover:scale-110", IconColor)} />
                            </div>
                            <span className={cn("text-[8px] font-black uppercase tracking-[0.3em] px-2 py-1 rounded-lg border", RarityColor.split(" ")[0], RarityColor.split(" ")[2])}>{RarityLabel}</span>
                          </div>
                          <div>
                            <p className={cn("text-sm font-black uppercase tracking-tight", RarityColor.split(" ")[0])}>{acc.title}</p>
                            <p className="text-[10px] font-mono text-white/50 mt-1 uppercase tracking-wider relative z-10 leading-relaxed">{acc.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="friends-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 min-h-[400px]"
              >
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Sync via Network Signature</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="ENTER DESTINATION ID..." 
                      value={searchUid} 
                      onChange={(e) => setSearchUid(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-[10px] uppercase font-black tracking-widest focus:outline-none focus:border-primary/50 transition-colors font-mono placeholder:text-white/20"
                    />
                    <button 
                      disabled={!searchUid || requestSent}
                      onClick={() => {
                        playClick();
                        setRequestSent(true);
                        onAddFriend?.(searchUid, "UNKNOWN AGENT");
                        setTimeout(() => { setSearchUid(''); setRequestSent(false); }, 2000);
                      }}
                      className={cn(
                        "px-6 skeuo-button border border-white/10 rounded-2xl transition-colors",
                         (!searchUid || requestSent) ? "opacity-50" : "flex items-center gap-2 hover:text-primary hover:border-primary/50"
                      )}
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {friendRequests.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Pending Uplinks [{friendRequests.length}]</h4>
                    <div className="grid gap-3">
                      {friendRequests.map((req) => (
                        <div key={req.fromUid} className="glass-dark border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 skeuo-pressed rounded-xl flex items-center justify-center bg-primary/5">
                              <User className="w-5 h-5 text-primary/40" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-white uppercase tracking-tight">{req.fromName}</p>
                              <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">ID: {req.fromUid.slice(0, 8)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { playClick(); onAcceptFriend?.(req); }}
                              className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary hover:bg-primary/20 transition-all shadow-glow-sm"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { playClick(); onRejectFriend?.(req); }}
                              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500/60 hover:text-red-500 transition-all"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Tactical Squad [{friends.length}]</h4>
                  {friends.length === 0 ? (
                    <div className="p-12 text-center skeuo-pressed rounded-3xl border border-white/5 animate-pulse">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">No active uplinks found.</p>
                      <p className="text-[8px] font-medium text-white/10 uppercase tracking-widest mt-2 uppercase">Recruit agents from the global leaderboard.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {friends.map((friend) => (
                        <div key={friend.uid} className="glass-dark border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-10 h-10 skeuo-raised rounded-xl flex items-center justify-center">
                                <User className="w-5 h-5 text-white/40" />
                              </div>
                              <div className={cn(
                                "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a0a]",
                                friend.status === 'online' ? "bg-green-500 animate-pulse" : "bg-white/10"
                              )} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-white uppercase tracking-tight">{friend.name}</p>
                              <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">STATUS: {friend.status.toUpperCase()} • ID: {friend.uid.slice(0, 8)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                             <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/20 hover:text-primary transition-all">
                              <Mail className="w-4 h-4" />
                            </button>
                            <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/20 hover:text-primary transition-all">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const LeaderboardTransition = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      {/* Sword Swipe Line */}
      <motion.div
        initial={{ width: 0, opacity: 1, rotate: 45 }}
        animate={{ width: "200vw", opacity: [1, 1, 0] }}
        transition={{ duration: 0.5, ease: "easeIn" }}
        className="absolute h-2 bg-white shadow-[0_0_50px_#fff]"
      />
      
      {/* Screen Cut to Black */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "100vh" }}
        transition={{ delay: 0.5, duration: 0.3, ease: "circOut" }}
        className="absolute inset-0 bg-black flex flex-col justify-center m-auto"
      />

      {/* White Flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ delay: 2.8, duration: 0.1 }}
        className="absolute inset-0 bg-white"
      />
    </div>
  );
};

const FullLeaderboard = ({ data, onClose, onProfileClick, currentUserId, settings }: { data: any[], onClose: () => void, onProfileClick: (p: any) => void, currentUserId: string, settings: AppSettings }) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: settings.uiScale === 'half' ? 1 : 1.1,
        x: settings.uiScale === 'half' ? 100 : 0 
      }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ 
        opacity: 0, 
        scale: settings.uiScale === 'half' ? 1 : 0.95,
        x: settings.uiScale === 'half' ? 100 : 0
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed z-[9000] bg-[#020202] overflow-y-auto transition-all duration-300",
        settings.uiScale === 'half' 
          ? "top-0 right-0 h-full w-full max-w-2xl border-l border-white/10" 
          : "inset-0 w-full h-full"
      )}
    >
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 bg-grid opacity-10 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div className={cn(
        "relative min-h-screen",
        settings.uiScale === 'full' ? "px-4 md:px-12 lg:px-24" : "px-4"
      )}>
        <div className={cn(
          "mx-auto space-y-8 md:space-y-16 pt-24 md:pt-32 pb-40",
          settings.uiScale === 'full' ? "max-w-none" : "max-w-4xl"
        )}>
          
          {/* Main Content Group */}
          <div className="space-y-8 md:space-y-12">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8"
            >
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 skeuo-raised rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.2)] shrink-0">
                  <Crown className="w-6 h-6 md:w-8 md:h-8 text-primary icon-glow" />
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-3xl md:text-7xl font-black tracking-tighter uppercase text-white leading-none">Global <span className="text-primary text-glow">History</span></h2>
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.5em] text-white/20 mt-2">Born in India • Built for Gamers • Battle Verified</p>
                </div>
              </div>

              {/* Enhanced Animated Exit Button */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClick(); onClose(); }}
                className="group relative flex items-center gap-3 md:gap-4 bg-white/5 hover:bg-white/10 px-6 md:px-8 py-3 md:py-5 rounded-xl md:rounded-2xl border border-white/5 transition-all skeuo-raised"
              >
                <div className="bg-white/10 p-1.5 md:p-2 rounded-lg">
                  <IconWrapper>
                    <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </IconWrapper>
                </div>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-white/60 group-hover:text-primary transition-colors">Close Hall of Fame</span>
              </motion.button>
            </motion.div>
            
            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-x-auto transition-all duration-700",
                settings.theme === 'hue-morphism' && "hue-morphism",
                settings.theme === 'glass-morphism' && "glass-immersive",
                settings.theme !== 'hue-morphism' && settings.theme !== 'glass-morphism' && "glass-dark"
              )}
            >
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-8 md:px-12 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Rank</th>
                    <th className="px-8 md:px-12 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Combatant Profile</th>
                    <th className="px-8 md:px-12 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hidden md:table-cell">Eliminations</th>
                    <th className="px-8 md:px-12 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Aggregated Score</th>
                    <th className="px-8 md:px-12 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Dossier</th>
                    <th className="px-8 md:px-12 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((player, idx) => (
                    <motion.tr 
                      key={`full-row-${player.uid}-${idx}`}
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + idx * 0.02 }}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)', x: 10 }}
                      className="border-b border-white/5 transition-all group"
                    >
                      <td className="px-8 md:px-12 py-8">
                        <IconWrapper className={cn(
                          "w-12 h-12 skeuo-raised rounded-2xl flex items-center justify-center font-black text-lg",
                          idx === 0 ? "text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] border-yellow-500/20" : 
                          idx === 1 ? "text-gray-400 border-white/10" : 
                          idx === 2 ? "text-amber-700 border-amber-700/20" : "text-white/20 border-white/5"
                        )}>
                          {idx === 0 ? (
                            <Crown className="w-6 h-6 animate-pulse text-primary icon-glow" />
                          ) : idx + 1}
                        </IconWrapper>
                      </td>
                      <td className="px-8 md:px-12 py-8">
                        <div className="flex items-center gap-6">
                          <IconWrapper className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hidden md:flex items-center justify-center group-hover:rotate-6 transition-transform">
                            <User className="w-5 h-5 text-white/20 group-hover:text-primary/50" />
                          </IconWrapper>
                          <div>
                            <p className="font-black uppercase tracking-tighter text-xl group-hover:text-primary transition-colors">{player.name}</p>
                            <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">ID: {player.uid.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 md:px-12 py-8 font-mono text-white/40 text-xl hidden md:table-cell">
                        <AnimatedNumber value={player.kills} />
                      </td>
                      <td className="px-8 md:px-12 py-8 font-black text-primary text-2xl text-glow bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 bg-[length:200%_100%] hover:animate-shimmer-text">
                        <AnimatedNumber value={player.points} />
                      </td>
                      <td className="px-8 md:px-12 py-8 text-right">
                        <button 
                          onClick={() => onProfileClick({ ...player, isOwnProfile: player.uid === currentUserId })}
                          className="px-8 py-3 skeuo-button border border-white/5 hover:border-primary/50 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-primary transition-all rounded-xl"
                        >
                          Access Dossier
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Leaderboard = ({ socket, currentUserId, onProfileClick, headingEffect, settings }: { socket?: any, currentUserId: string, onProfileClick: (player: any) => void, headingEffect: string, settings: AppSettings }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransition, setShowTransition] = useState(false);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = (updatedLeaderboard: any[]) => {
      setData(updatedLeaderboard);
    };

    socket.on("leaderboard:update", handleUpdate);
    return () => {
      socket.off("leaderboard:update", handleUpdate);
    };
  }, [socket]);

  const handleViewMore = () => {
    setShowTransition(true);
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    setShowFull(true);
  };

  return (
    <>
        <section id="leaderboard" className="py-32 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-6">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-display text-white">
              <EffectText effect={headingEffect}>
                Global <span className="text-primary text-glow">Leaderboard</span>
              </EffectText>
            </h2>
            <div className="h-1 w-32 bg-primary/30 mx-auto rounded-full" />
          </div>

          {loading ? (
            <LeaderboardSkeleton settings={settings} />
          ) : (
            <div className={cn(
              "rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl overflow-x-auto transition-all duration-700",
              settings.theme === 'hue-morphism' && "hue-morphism",
              settings.theme === 'glass-morphism' && "glass-immersive",
              settings.theme !== 'hue-morphism' && settings.theme !== 'glass-morphism' && "glass-dark"
            )}>
              <table className="w-full text-left border-collapse min-w-[300px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-4 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Rank</th>
                    <th className="px-4 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Competitor</th>
                    <th className="px-4 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hidden sm:table-cell">Elims</th>
                    <th className="px-4 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/20 text-right sm:text-center">Score</th>
                    <th className="px-4 md:px-10 py-6 md:py-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/20 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((player, idx) => (
                    <tr key={`mini-row-${player.uid || player.name}-${idx}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 md:px-10 py-6 md:py-8">
                        <IconWrapper className={cn(
                          "w-8 h-8 md:w-10 md:h-10 skeuo-raised rounded-lg md:rounded-xl flex items-center justify-center font-black text-xs md:text-sm",
                          idx === 0 ? "text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]" : 
                          idx === 1 ? "text-gray-400" : 
                          idx === 2 ? "text-amber-700" : "text-white/40"
                        )}>
                          {idx === 0 ? (
                            <Crown className="w-4 h-4 md:w-5 md:h-5 animate-pulse text-primary icon-glow" />
                          ) : idx + 1}
                        </IconWrapper>
                      </td>
                      <td className="px-4 md:px-10 py-6 md:py-8">
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hidden lg:block overflow-hidden p-1">
                            <div className="w-full h-full rounded-full bg-primary/20" />
                          </div>
                          <span className="font-black uppercase tracking-tighter text-sm md:text-lg group-hover:text-primary transition-colors truncate max-w-[90px] md:max-w-none">{player.name}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-10 py-6 md:py-8 font-mono text-white/30 text-sm md:text-lg hidden sm:table-cell">{player.kills}</td>
                      <td className="px-4 md:px-10 py-6 md:py-8 font-black text-primary text-base md:text-xl text-glow text-right sm:text-center">{player.points ?? 0}</td>
                      <td className="px-4 md:px-10 py-6 md:py-8 text-right">
                        <button 
                          onClick={() => { playClick(); onProfileClick({ ...player, isOwnProfile: player.uid === currentUserId }); }}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 hover:text-primary transition-all skeuo-button"
                        >
                          <User className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewMore}
              className="skeuo-button laser-border bg-gradient-animate px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-primary border border-primary/20 hover:border-primary transition-all shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
            >
              <span>See All History</span>
            </motion.button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showTransition && <LeaderboardTransition onComplete={handleTransitionComplete} />}
        {showFull && <FullLeaderboard data={data} onClose={() => setShowFull(false)} onProfileClick={onProfileClick} currentUserId={currentUserId} settings={settings} />}
      </AnimatePresence>
    </>
  );
};

const Sponsorships = () => (
  <RevealSection delay={0.2}>
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto space-y-12">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Official Partners</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
          {SPONSORS.map((s) => (
            <motion.img 
              key={s.name} 
              src={s.logo} 
              alt={s.name} 
              whileHover={{ scale: 1.1, opacity: 1, filter: 'grayscale(0)' }}
              className="h-8 md:h-12 object-contain" 
              referrerPolicy="no-referrer" 
            />
          ))}
        </div>
      </div>
    </section>
  </RevealSection>
);



interface TournamentCardProps {
  tournament: Tournament;
  onJoin: (t: Tournament) => void;
  headingEffect: string;
  cardStyle?: AppSettings['cardStyle'];
  theme?: AppSettings['theme'];
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onJoin, headingEffect, cardStyle, theme }) => {
  const isFeatured = tournament.id.startsWith('big-') || tournament.entryFee >= 10000;
  
  const effectiveStyle = theme === 'hue-morphism' ? 'hue' : (theme === 'glass-morphism' ? 'glass' : cardStyle || 'skeuo');

  const cardClasses = cn(
    "rounded-3xl overflow-hidden group relative border transition-all duration-700",
    effectiveStyle === 'skeuo' && "skeuo-raised",
    effectiveStyle === 'flat' && "bg-[#0a0a0f] border-white/10",
    effectiveStyle === 'neon' && "bg-black border-primary/20",
    effectiveStyle === 'glass' && "glass-immersive",
    effectiveStyle === 'hue' && "hue-morphism",
    isFeatured ? "border-yellow-500/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.05)]" : "border-white/5"
  );

  return (
    <motion.div
      whileHover={{ 
        y: -12, 
        scale: 1.02,
        boxShadow: isFeatured ? "0 20px 40px -10px rgba(234, 179, 8, 0.4)" : "0 10px 40px -10px var(--color-primary)",
        borderColor: isFeatured ? "rgba(234, 179, 8, 0.5)" : "var(--color-primary)",
      }}
      animate={effectiveStyle === 'hue' ? {
        boxShadow: [
          "0 0 20px rgba(var(--color-primary-rgb), 0.1)",
          "0 0 40px rgba(var(--color-primary-rgb), 0.3)",
          "0 0 20px rgba(var(--color-primary-rgb), 0.1)"
        ]
      } : {}}
      transition={effectiveStyle === 'hue' ? {
        boxShadow: { repeat: Infinity, duration: 4, ease: "easeInOut" },
        y: { duration: 0.4, ease: "easeOut" }
      } : { duration: 0.4, ease: "easeOut" }}
      onMouseEnter={playHover}
      className={cardClasses}
    >
      <div className="absolute inset-0 z-0">
        <img 
          src={tournament.image} 
          alt={tournament.title} 
          className={cn(
            "w-full h-full object-cover transition-all duration-1000",
            isFeatured ? "grayscale-0 opacity-40 group-hover:opacity-60" : "grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-50 group-hover:scale-110"
          )} 
        />
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t",
          isFeatured ? "from-black via-black/80 to-yellow-500/5" : "from-[#020202] via-[#020202]/80 to-transparent"
        )} />
        {isFeatured && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.1),transparent_70%)] animate-pulse" />
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {isFeatured && (
          <span className="text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-lg bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]">
            ELITE
          </span>
        )}
        <span className={cn(
          "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg backdrop-blur-xl border border-white/10",
          tournament.status === 'Open' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
        )}>
          {tournament.status}
        </span>
      </div>

      <div className="p-8 space-y-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 skeuo-raised rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform",
            isFeatured ? "bg-yellow-500/20 border-yellow-500/30" : ""
          )}>
            <IconWrapper>
              <Sword className={cn("w-6 h-6 icon-glow", isFeatured ? "text-yellow-500" : "text-primary")} />
            </IconWrapper>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-black text-lg md:text-xl tracking-tighter uppercase transition-colors truncate",
              isFeatured ? "text-yellow-500" : "group-hover:text-primary"
            )}>
              <EffectText effect={headingEffect}>
                {tournament.title}
              </EffectText>
            </h3>
            <p className="text-[9px] md:text-[10px] text-white/30 font-black tracking-[0.2em] md:tracking-[0.3em] uppercase mt-1 truncate">{tournament.type} • {tournament.date}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            "backdrop-blur-md p-4 rounded-2xl border skeuo-pressed transition-colors",
            isFeatured ? "bg-yellow-500/5 border-yellow-500/20" : "bg-black/40 border-white/5 group-hover:border-primary/20"
          )}>
            <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.2em] mb-1">Prize Pool</p>
            <p className={cn(
              "font-black text-2xl",
              isFeatured ? "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" : "text-primary drop-shadow-[0_0_8px_var(--color-primary)]"
            )}>{tournament.prize}</p>
          </div>
          <div className={cn(
            "backdrop-blur-md p-4 rounded-2xl border skeuo-pressed transition-colors",
            isFeatured ? "bg-yellow-500/5 border-yellow-500/20" : "bg-black/40 border-white/5 group-hover:border-primary/20"
          )}>
            <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.2em] mb-1">Squad Slots</p>
            <p className="font-black text-2xl text-white/90">{tournament.slots.split('/')[1].replace(/\d+/, (m) => (parseInt(m) - parseInt(tournament.slots.split('/')[0])).toString())}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex items-center gap-2">
            <CoinWrapper>
              <Coins className={cn("w-4 h-4", isFeatured ? "text-yellow-400" : "text-yellow-500")} />
            </CoinWrapper>
            <span className={cn(
              "text-xs font-black tracking-widest",
              isFeatured ? "text-yellow-500/80" : "text-white/60"
            )}>{tournament.entryFee} CREDITS</span>
          </div>
          <div className="flex gap-3">
            {tournament.type !== 'Solo' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClick(); /* Team selection logic would go here */ }}
                className={cn(
                  "p-3 skeuo-button border rounded-xl transition-all",
                  isFeatured ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500/60 hover:text-yellow-500" : "bg-white/5 border-white/10 text-white/40 hover:text-primary"
                )}
                title="Form Combat Squad"
              >
                <Users className="w-4 h-4" />
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={tournament.status !== 'Open'}
              onClick={() => { playClick(); onJoin(tournament); }}
              className={cn(
                "px-6 py-3 transition-all rounded-xl font-black uppercase tracking-[0.2em] text-[10px] border",
                tournament.status === 'Open' 
                  ? "skeuo-button laser-border bg-gradient-animate text-white border-white/10 hover:border-primary/50" 
                  : "bg-white/5 opacity-50 cursor-not-allowed border-white/5"
              )}
            >
              <span>{tournament.status === 'Open' ? 'Join Tournament' : 'Closed'}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ConfirmTournamentModal = ({
  tournament,
  onConfirm,
  onClose,
  settings
}: {
  tournament: Tournament;
  onConfirm: () => void;
  onClose: () => void;
  settings: AppSettings;
}) => {
  // New briefing content
  const rules = [
    "Mobile Play Only: Play fair on your phone, no emulators please.",
    "Fair Play: Our anti-cheat keeps things honest for everyone.",
    "Be on Time: Please check-in 15 minutes before the match stars.",
    "Rewards: Points for both your rank and your awesome kills!"
  ];

  const prizes = [
    { rank: "Champion", reward: "₹2,500 + 500 Coins" },
    { rank: "Runner Up", reward: "₹1,250 + 250 Coins" },
    { rank: "3rd Place", reward: "₹750 + 100 Coins" },
    { rank: "4th - 5th", reward: "₹250 Each" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto"
    >
      <motion.div
        initial={{ 
          scale: settings.uiScale === 'half' ? 1 : 0.9, 
          x: settings.uiScale === 'half' ? -100 : 0, 
          opacity: 0 
        }}
        animate={{ scale: 1, x: 0, opacity: 1 }}
        exit={{ 
          scale: settings.uiScale === 'half' ? 1 : 0.95, 
          x: settings.uiScale === 'half' ? -100 : 0, 
          opacity: 0 
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "glass-dark border border-white/5 flex flex-col relative overflow-y-auto shadow-2xl scrollbar-hide p-8 md:p-12 transition-all duration-300",
          settings.uiScale === 'half' 
            ? "fixed top-0 left-0 h-full w-full max-w-2xl border-r rounded-none" 
            : "fixed inset-0 w-full h-full rounded-none"
        )}
      >
        <div className="flex justify-between items-start mb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest">
                Tournament Info
              </div>
              <div className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                {tournament.id}
              </div>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
              {tournament.title} <span className="text-primary text-glow">Details</span>
            </h2>
          </div>
          <button onClick={() => { playClick(); onClose(); }} className="skeuo-raised p-4 rounded-2xl hover:text-primary transition-colors border border-white/5 text-white/40">
            <IconWrapper>
              <X className="w-6 h-6" />
            </IconWrapper>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left Column: What you need to know */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <ClipboardList className="w-5 h-5" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em]">How to Play</h3>
              </div>
              <ul className="space-y-4">
                {rules.map((rule, idx) => (
                  <li key={idx} className="flex gap-4 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 group-hover:bg-primary transition-colors" />
                    <p className="text-[11px] font-medium text-white/50 leading-relaxed uppercase tracking-wide">
                      {rule}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 skeuo-pressed space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Entry Fee</span>
                <div className="flex items-center gap-2 text-yellow-500">
                  <Coins className="w-4 h-4" />
                  <span className="text-2xl font-black">{tournament.entryFee}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Squad Type</span>
                <span className="text-sm font-black uppercase text-white">{tournament.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Deployment Date</span>
                <span className="text-sm font-black uppercase text-white">{tournament.date}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Reward Logistics */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-yellow-500">
                <Trophy className="w-5 h-5" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em]">Bounty Breakdown</h3>
              </div>
              <div className="space-y-3">
                {prizes.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-500/30 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{p.rank}</span>
                    <span className="text-[11px] font-black uppercase tracking-tighter text-yellow-500">{p.reward}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-6 text-center leading-relaxed">
                By clicking confirm, you authorize coin deduction and agree to tactical compliance.
              </p>
              <div className="flex gap-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { playClick(); onClose(); }}
                  className="flex-1 skeuo-button py-6 px-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all bg-white/5 border border-white/10 hover:border-white/20 text-white/30 hover:text-white"
                >
                  Abort
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { playClick(); onConfirm(); }}
                  className="flex-2 skeuo-button laser-border bg-gradient-animate py-6 px-10 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all text-white border border-primary/30 shadow-[0_20px_50px_rgba(0,240,255,0.2)]"
                >
                  <span>Join the Fight</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const JoinModal = ({ 
  tournament, 
  onClose, 
  onSuccess,
  userId,
  coins,
  setCoins,
  settings
}: { 
  tournament: Tournament; 
  onClose: () => void;
  onSuccess: (requestId: string) => void;
  userId: string;
  coins: number;
  setCoins: (coins: number) => void;
  settings: AppSettings;
}) => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticketData, setTicketData] = useState<{roomId: string, roomPass: string, requestId: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !gameId || !phone || !email) return;
    setError('');

    if (coins < tournament.entryFee) {
      setError(`Insufficient credits. You need ${tournament.entryFee} credits to join.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          gameId,
          phone,
          email,
          tournamentId: tournament.id,
          tournamentTitle: tournament.title,
          userId
        })
      });
      const data = await res.json();
      if (data.success) {
        setCoins(data.coins);
        setTicketData({ roomId: data.roomId, roomPass: data.roomPass, requestId: data.requestId });
        playSuccess();
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#ffffff', '#000000']
        });
      } else {
        setError(data.error || 'Failed to initialize session');
      }
    } catch (err) {
      console.error(err);
      setError('Uplink failed. Retrying...');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl overflow-y-auto flex flex-col"
    >
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-12 min-h-screen">
        <motion.div
          initial={{ 
            scale: settings.uiScale === 'half' ? 1 : 0.9, 
            x: settings.uiScale === 'half' ? 100 : 0, 
            opacity: 0 
          }}
          animate={{ scale: 1, x: 0, opacity: 1 }}
          exit={{ 
            scale: settings.uiScale === 'half' ? 1 : 0.95, 
            x: settings.uiScale === 'half' ? 100 : 0, 
            opacity: 0 
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={cn(
            "glass-dark border border-white/5 flex flex-col relative overflow-y-auto shadow-2xl scrollbar-hide transition-all duration-300",
            settings.uiScale === 'half' 
              ? "fixed top-0 right-0 h-full w-full max-w-2xl border-l rounded-none" 
              : "fixed inset-0 w-full h-full rounded-none"
          )}
        >
          <div className="bg-white/5 border-b border-white/5 p-6 md:p-10 flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white">
                {ticketData ? 'Ticket Ready' : 'Tournament Entry'}
              </h2>
              <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] md:tracking-[0.4em] text-primary mt-2">{tournament.title}</p>
            </div>
            <button onClick={() => { playClick(); onClose(); }} className="relative z-10 skeuo-raised p-3 rounded-xl hover:text-primary transition-colors">
              <IconWrapper>
                <X className="w-5 h-5" />
              </IconWrapper>
            </button>
          </div>

          {ticketData ? (
            <div className="p-6 md:p-10 space-y-8 md:space-y-10">
              <div className="text-center space-y-4">
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-16 h-16 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 skeuo-raised border border-green-500/20"
                >
                  <CheckCircle2 className="w-8 h-8" />
                </motion.div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-green-400 uppercase tracking-tighter">Entry Validated</h3>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Transaction Authorized</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-dark p-6 rounded-2xl border border-white/5 skeuo-pressed space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <User className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Player Identity</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-white uppercase tracking-tight">{playerName}</p>
                    <p className="text-[9px] font-bold text-white/30 truncate tracking-widest font-mono">UID: {gameId}</p>
                  </div>
                </div>

                <div className="glass-dark p-6 rounded-2xl border border-white/5 skeuo-pressed space-y-4">
                  <div className="flex items-center gap-3 text-yellow-500">
                    <Coins className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500/60">Currency Status</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-white uppercase tracking-tight">{coins} CREDITS</p>
                    <p className="text-[9px] font-bold text-red-500/60 uppercase tracking-widest">Debited: {tournament.entryFee}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 p-8 rounded-2xl border border-white/5 shadow-inner flex flex-col items-center justify-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-6 flex items-center gap-2">
                  <Shield className="w-3 h-3" /> Get Your Ticket
                </p>
                <div className="grid grid-cols-2 gap-12 w-full text-center divide-x divide-white/5">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-white/40 mb-2 tracking-[0.2em]">ID CODE</p>
                    <p className="font-mono text-3xl text-primary font-black tracking-widest">{ticketData.roomId}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-white/40 mb-2 tracking-[0.2em]">PASS KEY</p>
                    <p className="font-mono text-3xl text-primary font-black tracking-widest">{ticketData.roomPass}</p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playClick();
                  onSuccess(ticketData.requestId);
                  onClose();
                }}
                className="w-full skeuo-button laser-border bg-gradient-animate py-5 px-8 rounded-2xl font-black uppercase tracking-[0.3em] text-xs text-white border border-white/10"
              >
                <span>Check Past Matches</span>
              </motion.button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8 md:space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                {[
                  { label: 'Combat Tag', value: playerName, setter: setPlayerName, icon: Gamepad2, type: 'text' },
                  { label: 'Agent UID', value: gameId, setter: setGameId, icon: Shield, type: 'text' },
                  { label: 'Comms Email', value: email, setter: setEmail, icon: MessageSquare, type: 'email' },
                  { label: 'Encryption Mobile', value: phone, setter: setPhone, icon: Users, type: 'tel' }
                ].map((field) => (
                  <div className="space-y-4" key={field.label}>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 flex items-center gap-3">
                      <IconWrapper>
                        <field.icon className="w-3 h-3 text-primary" />
                      </IconWrapper> 
                      {field.label}
                    </label>
                    <input
                      required
                      type={field.type}
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      className="w-full bg-[#050505] border border-white/5 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-all text-sm font-bold tracking-widest skeuo-pressed"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500/80 text-[10px] font-black uppercase tracking-[0.2em] text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="pt-10 border-t border-white/5 space-y-8">
                <div className="flex items-center justify-between bg-black/40 p-6 rounded-2xl border border-white/5 skeuo-pressed">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Joining Fee</span>
                  <div className="flex items-center gap-3 text-primary">
                    <CoinWrapper>
                      <Coins className="w-4 h-4" />
                    </CoinWrapper>
                    <span className="text-2xl font-black tracking-widest">{tournament.entryFee} CREDITS</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={playHover}
                  onClick={playClick}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full skeuo-button laser-border py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-xs text-white border border-white/10 flex items-center justify-center gap-4 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-primary drop-shadow-[0_0_10px_var(--color-primary)]" /> : 'Confirm Initialization'}
                </motion.button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

const StatusCard = ({ requestId, onClear }: { requestId: string, onClear: () => void }) => {
  const [request, setRequest] = useState<JoinRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/status/${requestId}`);
      const data = await res.json();
      if (!data.error) {
        setRequest(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); 
    return () => clearInterval(interval);
  }, [requestId]);

  if (loading || !request) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border border-white/5 max-w-2xl mx-auto w-full relative overflow-hidden shadow-2xl"
    >
      <div className="absolute top-4 right-4 z-10">
        <button onClick={onClear} className="skeuo-raised p-2 rounded-lg text-white/20 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
        <div className="w-20 h-20 skeuo-raised rounded-2xl flex items-center justify-center shrink-0">
          {request.status === 'approved' ? (
            <CheckCircle2 className="w-10 h-10 text-green-500 icon-glow" />
          ) : (
            <Loader2 className="w-10 h-10 text-primary animate-spin icon-glow" />
          )}
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <h3 className="text-2xl font-black tracking-tighter uppercase text-white">
              {request.status === 'approved' ? 'Sync Established' : 'Synchronizing...'}
            </h3>
            <p className="text-white/20 font-black tracking-[0.2em] uppercase text-[10px] mt-1">
              {request.tournamentTitle} • REF: {requestId}
            </p>
          </div>

          {request.status === 'approved' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 skeuo-pressed">
                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-1">Ticket Number</p>
                <p className="text-xl font-black text-primary tracking-[0.2em]">{request.roomId}</p>
              </div>
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 skeuo-pressed flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-1">Access Key</p>
                  <p className="text-xl font-black tracking-[0.2em] text-white">
                    {showPass ? request.roomPass : '••••••'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowPass(!showPass)}
                  className="p-2 skeuo-raised rounded-lg text-white/30 hover:text-primary transition-colors"
                >
            <IconWrapper>
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </IconWrapper>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-white/40 text-[11px] font-bold leading-relaxed uppercase tracking-wider">
              Uplink in progress. Deployment parameters will manifest shortly. 
              Status: <span className="text-primary/80">SYNCHRONIZING</span>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  
  const steps = [
    {
      title: "Tactical Induction",
      message: "Welcome to GLENK GT! We're so glad to have you here. You're now part of India's biggest community of champion players. Let's get you set up for your first win.",
      target: null,
      icon: <Target className="w-8 h-8 text-primary" />
    },
    {
      title: "Credit Reservoir",
      message: "This is your gaming wallet. Click here to add coins, check your balance, or redeem your winnings.",
      target: "nav-credits",
      icon: <Coins className="w-8 h-8 text-yellow-500" />
    },
    {
      title: "Deployment Registration",
      message: "Browse active nodes below. To register, select a tournament and use your credits to secure a position in the combat roster.",
      target: "tournaments",
      icon: <Gamepad2 className="w-8 h-8 text-primary" />
    },
    {
      title: "Intelligence Hub",
      message: "Analyze the top-performing agents. You can now access detailed dossiers of elite combatants directly from the intelligence feed.",
      target: "leaderboard",
      icon: <Crown className="w-8 h-8 text-primary icon-glow" />
    },
    {
      title: "Profile Management",
      message: "Manage your agent identity here. Verify your unique signature, track total earnings, and update your tactical standing.",
      target: "nav-profile",
      icon: <User className="w-8 h-8 text-primary" />
    },
    {
      title: "Systems Online",
      message: "Induction complete. Your terminal is fully synchronized. Proceed with your first deployment when ready. Dominance awaits.",
      target: null,
      icon: <Zap className="w-8 h-8 text-primary" />
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      playClick();
      if (steps[step + 1].target) {
        document.getElementById(steps[step + 1].target!)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      playSuccess();
      localStorage.setItem('gt_onboarding_v2', 'true');
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Background Dim */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto" 
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={cn(
            "pointer-events-auto fixed bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] glass-dark w-full max-w-md",
            currentStep.target ? "bottom-12 right-12" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
        >
          {/* Scanline Effect */}
          <div className="absolute inset-0 animate-scanline pointer-events-none opacity-20" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 skeuo-raised rounded-2xl flex items-center justify-center mb-2">
              <IconWrapper>
                {currentStep.icon}
              </IconWrapper>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
                {currentStep.title} <span className="text-primary text-glow">[{step + 1}/{steps.length}]</span>
              </h3>
              <p className="text-sm text-white/50 leading-relaxed font-medium">
                {currentStep.message}
              </p>
            </div>

            <div className="flex gap-4 w-full pt-4">
              <button 
                onClick={() => {
                  localStorage.setItem('gt_onboarding_v2', 'true');
                  onComplete();
                }}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button 
                onClick={handleNext}
                className="flex-[2] skeuo-button laser-border py-4 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] text-white border border-primary/20 bg-primary/10 shadow-[0_0_20px_rgba(0,240,255,0.1)]"
              >
                {step === steps.length - 1 ? "Start Gaming" : "Next Step"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Target Highlight */}
      <AnimatePresence>
        {currentStep.target && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none border-2 border-primary shadow-[0_0_30px_var(--color-primary)] rounded-2xl z-[10001]"
            style={{
              top: (document.getElementById(currentStep.target)?.getBoundingClientRect().top || 0) - 8,
              left: (document.getElementById(currentStep.target)?.getBoundingClientRect().left || 0) - 8,
              width: (document.getElementById(currentStep.target)?.getBoundingClientRect().width || 0) + 16,
              height: (document.getElementById(currentStep.target)?.getBoundingClientRect().height || 0) + 16,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  settings, 
  setSettings 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  settings: AppSettings, 
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>> 
}) => {
  const [activeTab, setActiveTab] = useState<'visuals' | 'layout' | 'content' | 'system'>('visuals');

  if (!isOpen) return null;

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    if (confirm("Reset everything back to how it was at the start?")) {
      setSettings({
        primaryColor: '#0ea5ff',
        secondaryColor: '#3b82f6',
        bgStyle: 'nebula',
        borderRadius: 'large',
        uiDensity: 'normal',
        animationSpeed: 1,
        glowIntensity: 1,
        showParticles: true,
        glassOpacity: 0.1,
        showHero: true,
        showTournaments: true,
        showLeaderboard: true,
        showStats: true,
        cardStyle: 'skeuo',
        navPosition: 'bottom',
        textTransform: 'uppercase',
        stickyHeader: true,
        showFooter: true,
        soundVolume: 0.5,
        enableTilt: true,
        fontFamily: 'Outfit',
        headingEffect: 'glow',
        theme: 'default',
        uiScale: 'full',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ 
          scale: settings.uiScale === 'half' ? 0.95 : 1, 
          opacity: 0, 
          x: settings.uiScale === 'half' ? 100 : 0,
          y: settings.uiScale === 'half' ? 0 : 20 
        }}
        animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
        exit={{ 
          scale: settings.uiScale === 'half' ? 0.95 : 1, 
          opacity: 0, 
          x: settings.uiScale === 'half' ? 100 : 0,
          y: settings.uiScale === 'half' ? 0 : 20 
        }}
        className={cn(
          "relative bg-[#0a0a0f] border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row transition-all duration-300",
          settings.uiScale === 'half' 
            ? "fixed top-0 right-0 h-full w-full max-w-2xl border-l rounded-none" 
            : "fixed inset-0 w-full h-full max-w-none rounded-none border-none"
        )}
      >
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white/5 border-r border-white/5 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-8 px-2">
            <Settings className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">System <span className="text-primary italic">Override</span></h2>
          </div>
          
          {[
            { id: 'visuals', icon: Palette, label: 'Visual Mastery' },
            { id: 'layout', icon: Layout, label: 'Space & Form' },
            { id: 'content', icon: Eye, label: 'Core Directives' },
            { id: 'system', icon: Zap, label: 'Neural Tuning' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group",
                activeTab === tab.id ? "bg-primary text-black" : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-black" : "text-primary")} />
              {tab.label}
            </button>
          ))}

          <div className="mt-auto pt-6 border-t border-white/5">
            <button 
              onClick={resetSettings}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 scrollbar-hide">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-1">Configuration Path</p>
              <h3 className="text-3xl font-black uppercase tracking-tighter text-white">
                {activeTab === 'visuals' && 'Aesthetic Calibration'}
                {activeTab === 'layout' && 'Architectural Flow'}
                {activeTab === 'content' && 'Presence Logic'}
                {activeTab === 'system' && 'Performance Gradients'}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-3 skeuo-raised rounded-full hover:text-primary transition-colors text-white/40"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-10 pb-12">
            {activeTab === 'visuals' && (
              <div className="space-y-8">
                {/* Primary Color */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Primary Spectrum</label>
                  <div className="flex flex-wrap gap-4">
                    {['#0ea5ff', '#00f0ff', '#ff0055', '#a855f7', '#10b981', '#f59e0b', '#ffffff'].map((color) => (
                      <button
                        key={color}
                        onClick={() => updateSetting('primaryColor', color)}
                        className={cn(
                          "w-12 h-12 rounded-2xl border-4 transition-all scale-hover",
                          settings.primaryColor === color ? "border-white" : "border-white/10"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <div className="relative w-12 h-12 rounded-2xl border-4 border-white/10 bg-white/5 overflow-hidden">
                      <input 
                        type="color" 
                        value={settings.primaryColor}
                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Palette className="absolute inset-0 m-auto w-5 h-5 text-white/40" />
                    </div>
                  </div>
                </div>

                {/* Themes */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Thematic Immersion (Themes)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'default', label: 'Classic GLENK', desc: 'Neural Cyberpunk' },
                      { id: 'minecraft', label: 'Craft World', desc: 'Voxel Pixelated' },
                      { id: 'fortnite', label: 'Sky Drop', desc: 'Bubbly & Stylized' },
                      { id: 'bgmi', label: 'Battle Field', desc: 'Tactical Gritty' },
                      { id: 'cod', label: 'Black Ops', desc: 'Modern Military' },
                      { id: 'freefire', label: 'Booyah Strike', desc: 'Hot Slanted' },
                      { id: 'gta5', label: 'Grand Theft V', desc: 'Rockstar Gold' },
                      { id: 'gta6', label: 'Vice City VI', desc: 'Neon Dream' },
                      { id: 'cyberpunk', label: 'Night City', desc: 'Future Dystopia' },
                      { id: 'eldenring', label: 'Elden Ring', desc: 'Golden Order' },
                      { id: 'valorant', label: 'Radiant Strike', desc: 'Tactical Anime' },
                      { id: 'apex', label: 'Outlands', desc: 'Mercenary Gear' },
                      { id: 'doom', label: 'Hell Walker', desc: 'Brutal Steel' },
                      { id: 'lol', label: 'Runeterra', desc: 'Magic Hextech' },
                      { id: 'hue-morphism', label: 'Hue Morphism', desc: 'Vibrant Light Flow' },
                      { id: 'glass-morphism', label: 'Glass Morphism', desc: 'Frosted Depth' }
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => updateSetting('theme', theme.id)}
                        className={cn(
                          "flex flex-col items-start gap-1 p-4 rounded-2xl border-2 transition-all group overflow-hidden relative text-left",
                          settings.theme === theme.id ? "border-primary bg-primary/10" : "border-white/5 hover:bg-white/5"
                        )}
                      >
                        <span className="text-xs font-black uppercase tracking-tighter text-white">
                          {theme.label}
                        </span>
                        <span className="text-[9px] text-white/40 font-medium">
                          {theme.desc}
                        </span>
                        {settings.theme === theme.id && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_var(--color-primary)]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Cerebral Font Selection</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['Outfit', 'Inter', 'JetBrains Mono', 'Space Grotesk'].map((font) => (
                      <button
                        key={font}
                        onClick={() => updateSetting('fontFamily', font)}
                        className={cn(
                          "flex items-center justify-between px-6 py-4 rounded-2xl border-2 transition-all",
                          settings.fontFamily === font ? "border-primary bg-primary/10 text-white" : "border-white/5 text-white/40 hover:bg-white/5"
                        )}
                        style={{ fontFamily: font }}
                      >
                        <span className="text-sm font-bold tracking-tight">{font}</span>
                        {settings.fontFamily === font && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Effects */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Linguistic Resonance (Text Effects)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { id: 'none', label: 'Solid State', class: '' },
                      { id: 'glow', label: 'Ethereal Glow', class: 'text-glow' },
                      { id: 'edge-glow', label: 'Edge Corona', class: 'text-edge-glow' },
                      { id: 'cool-glow', label: 'Chroma Pulse', class: 'text-cool-glow' },
                      { id: 'blink', label: 'Neural Blink', class: 'text-blink-glow' },
                      { id: 'rotating', label: 'Linear Strip', class: 'text-rotating-strip' },
                      { id: 'side-rotating', label: 'Lateral Flow', class: 'text-side-rotating-strip' }
                    ].map((effect) => (
                      <button
                        key={effect.id}
                        onClick={() => updateSetting('headingEffect', effect.id)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-[2rem] border-2 transition-all group overflow-hidden",
                          settings.headingEffect === effect.id ? "border-primary bg-primary/5" : "border-white/5 hover:bg-white/5"
                        )}
                      >
                        <span className={cn("text-xs font-black uppercase tracking-tighter transition-all group-hover:scale-110", effect.class)}>
                          {effect.label}
                        </span>
                        {settings.headingEffect === effect.id && <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_var(--color-primary)]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Glow Intensity */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Neon Saturation</label>
                    <span className="text-[10px] font-mono text-primary">{(settings.glowIntensity * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="2" step="0.1" 
                    value={settings.glowIntensity}
                    onChange={(e) => updateSetting('glowIntensity', parseFloat(e.target.value))}
                    className="w-full accent-primary bg-white/5 h-2 rounded-full appearance-none flex-shrink-0"
                  />
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-8">
                {/* Interface Size */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Interface Size</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'half', icon: PanelRight, label: 'Compact Mode', desc: 'Focus on what matters most' },
                      { id: 'full', icon: Maximize, label: 'Immersive View', desc: 'Full screen experience' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => updateSetting('uiScale', mode.id)}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-3 py-6 rounded-[2.5rem] border-2 transition-all group",
                          settings.uiScale === mode.id ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,240,255,0.1)]" : "border-white/5 hover:bg-white/5"
                        )}
                      >
                        <mode.icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", settings.uiScale === mode.id ? "text-primary" : "text-white/20")} />
                        <div className="text-center">
                          <span className={cn("block text-[9px] font-black uppercase tracking-widest mb-1", settings.uiScale === mode.id ? "text-white" : "text-white/40")}>
                            {mode.label}
                          </span>
                          <span className="text-[8px] text-white/10 uppercase tracking-tighter hidden md:block">{mode.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* UI Density */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Volume Density</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'compact', icon: Minimize2, label: 'Hyper-Dense' },
                      { id: 'normal', icon: Maximize, label: 'Balanced' },
                      { id: 'relaxed', icon: Maximize2, label: 'Spacious' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => updateSetting('uiDensity', mode.id)}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-3 py-6 rounded-[2.5rem] border-2 transition-all group",
                          settings.uiDensity === mode.id ? "border-primary bg-primary/10" : "border-white/5 hover:bg-white/5"
                        )}
                      >
                        <mode.icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", settings.uiDensity === mode.id ? "text-primary" : "text-white/20")} />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", settings.uiDensity === mode.id ? "text-white" : "text-white/40")}>
                          {mode.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Style */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Structural Aesthetics</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: 'skeuo', label: 'Tactile Skeuo', desc: 'Inner shadows & depth' },
                      { id: 'flat', label: 'Minimal Edge', desc: 'Clean paths & shapes' },
                      { id: 'neon', label: 'Pulse Fusion', desc: 'Glowing boundaries' },
                      { id: 'glass', label: 'Glass Morph', desc: 'Backdrop blur depth' },
                      { id: 'hue', label: 'Hue Morph', desc: 'Color light flow' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => updateSetting('cardStyle', style.id)}
                        className={cn(
                          "text-left p-6 rounded-[2.5rem] border-2 transition-all",
                          settings.cardStyle === style.id ? "border-primary bg-primary/10" : "border-white/5 hover:bg-white/5"
                        )}
                      >
                        <p className={cn("text-xs font-black uppercase tracking-widest mb-1", settings.cardStyle === style.id ? "text-primary" : "text-white")}>{style.label}</p>
                        <p className="text-[9px] text-white/40 leading-relaxed uppercase tracking-tighter">{style.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Edge Curvature</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'none', icon: Square, label: 'Acute' },
                      { id: 'medium', icon: Circle, label: 'Rounded' },
                      { id: 'full', icon: Circle, label: 'Fluid' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => updateSetting('borderRadius', mode.id)}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-3 py-6 rounded-[2.5rem] border-2 transition-all",
                          settings.borderRadius === mode.id ? "border-primary bg-primary/10 text-white" : "border-white/5 text-white/40 hover:bg-white/5"
                        )}
                      >
                        <mode.icon className="w-5 h-5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-6">
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-8">Toggle system components to optimize cognitive load</p>
                
                {[
                  { id: 'showHero', label: 'Tactical Overview (Hero)', icon: Layout },
                  { id: 'showTournaments', label: 'Engagement Hub (Tournaments)', icon: Zap },
                  { id: 'showLeaderboard', label: 'Echelon Ranks (Leaderboard)', icon: LineChart },
                  { id: 'showStats', label: 'Vitals Display (User Stats)', icon: Eye },
                  { id: 'showFooter', label: 'Environmental Exit (Footer)', icon: Layout },
                ].map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-6 bg-white/5 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-white">{item.label}</span>
                    </div>
                    <button 
                      onClick={() => updateSetting(item.id as any, !settings[item.id as keyof AppSettings])}
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                        settings[item.id as keyof AppSettings] ? "bg-primary shadow-[0_0_20px_var(--color-primary)]" : "bg-white/10"
                      )}
                    >
                      {settings[item.id as keyof AppSettings] ? (
                        <Check className="w-6 h-6 text-black" />
                      ) : (
                        <X className="w-6 h-6 text-white/20" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-8">
                {/* Animation Speed */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Neural Response Time</label>
                    <span className="text-[10px] font-mono text-primary">{settings.animationSpeed.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="2" step="0.1" 
                    value={settings.animationSpeed}
                    onChange={(e) => updateSetting('animationSpeed', parseFloat(e.target.value))}
                    className="w-full accent-primary bg-white/5 h-2 rounded-full appearance-none"
                  />
                  <div className="flex justify-between text-[8px] text-white/10 font-black uppercase tracking-widest">
                    <span>Swift</span>
                    <span>Standard</span>
                    <span>Deliberate</span>
                  </div>
                </div>

                {/* Sound Volume */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Tactical Audio Feedback</label>
                    <Volume2 className="w-4 h-4 text-white/20" />
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={settings.soundVolume}
                    onChange={(e) => updateSetting('soundVolume', parseFloat(e.target.value))}
                    className="w-full accent-primary bg-white/5 h-2 rounded-full appearance-none"
                  />
                </div>

                {/* Booleans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'showParticles', label: 'Ethereal Particles', icon: Zap },
                    { id: 'enableTilt', label: 'Kinetic Tilt', icon: RotateCcw },
                    { id: 'stickyHeader', label: 'Locked Interface', icon: Maximize },
                    { id: 'navPosition', label: 'Top-Level Navigation', icon: Layout, isChoice: true },
                  ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => {
                        if (item.isChoice) {
                          updateSetting('navPosition', settings.navPosition === 'bottom' ? 'top' : 'bottom');
                        } else {
                          updateSetting(item.id as any, !settings[item.id as keyof AppSettings]);
                        }
                      }}
                      className={cn(
                        "flex items-center justify-between px-6 py-5 rounded-[2.5rem] border-2 transition-all",
                        (item.id === 'navPosition' ? settings.navPosition === 'top' : settings[item.id as keyof AppSettings]) 
                          ? "border-primary bg-primary/10" 
                          : "border-white/5 hover:bg-white/5"
                      )}
                    >
                      <span className={cn("text-[9px] font-black uppercase tracking-widest", (item.id === 'navPosition' ? settings.navPosition === 'top' : settings[item.id as keyof AppSettings]) ? "text-white" : "text-white/40")}>
                        {item.label}
                      </span>
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                        (item.id === 'navPosition' ? settings.navPosition === 'top' : settings[item.id as keyof AppSettings]) ? "bg-primary" : "bg-white/5"
                      )}>
                        {(item.id === 'navPosition' ? settings.navPosition === 'top' : settings[item.id as keyof AppSettings]) && <Check className="w-3 h-3 text-black" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[9px] uppercase tracking-[0.3em] font-black text-white/20">Conceptual Architecture by</p>
                <div className="text-primary font-black uppercase tracking-[0.2em] text-sm cursor-default">
                  tish
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [showCategoryHub, setShowCategoryHub] = useState(false);
  const [feeFilter, setFeeFilter] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmingTournament, setConfirmingTournament] = useState<Tournament | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(localStorage.getItem('gt_request_id'));
  const [showProfile, setShowProfile] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [showRedeem, setShowRedeem] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [currentAudioConfig, setCurrentAudioConfig] = useState(audioSettings);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Socket.io initialization
    socketRef.current = io();
    
    socketRef.current.on("notification", (notif: Omit<AppNotification, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications(prev => [{ ...notif, id }, ...prev]);
      playSuccess(); // Tactical audio cue
      
      // Auto-remove after some time
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 6000);
    });

    const fetchTournaments = async () => {
      setTournamentsLoading(true);
      try {
        const res = await fetch('/api/tournaments');
        if (!res.ok) throw new Error("Data stream interrupted");
        const data = await res.json();
        setTournaments(data);
      } catch (err: any) {
        console.error("Failed to fetch tournaments", err);
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [{ id, type: 'alert', title: 'INTELLIGENCE FEED ERROR', message: err.message || 'Failed to sync tournaments', timestamp: Date.now() }, ...prev]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
      } finally {
        setTournamentsLoading(false);
      }
    };
    fetchTournaments();

    // Re-fetch tournaments when a new one is added via socket
    socketRef.current?.on("notification", (notif: any) => {
      if (notif.type === 'tournament') {
        fetchTournaments();
      }
    });

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const [coins, setCoins] = useState(0);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userTags, setUserTags] = useState<string[]>([]);
  const [userSensei, setUserSensei] = useState<SenseiData | null>(null);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [viewedUser, setViewedUser] = useState<{name: string, points: number, uid: string} | null>(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('gt_app_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          primaryColor: '#0ea5ff',
          secondaryColor: '#3b82f6',
          bgStyle: 'nebula',
          borderRadius: 'large',
          uiDensity: 'normal',
          animationSpeed: 1,
          glowIntensity: 1,
          showParticles: true,
          glassOpacity: 0.1,
          showHero: true,
          showTournaments: true,
          showLeaderboard: true,
          showStats: true,
          cardStyle: 'skeuo',
          navPosition: 'bottom',
          textTransform: 'uppercase',
          stickyHeader: true,
          showFooter: true,
          soundVolume: 0.5,
          enableTilt: true,
          fontFamily: 'Outfit',
          headingEffect: 'glow',
          theme: 'default',
          uiScale: 'full',
          ...parsed
        };
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return {
      primaryColor: '#0ea5ff',
      secondaryColor: '#3b82f6',
      bgStyle: 'nebula',
      borderRadius: 'large',
      uiDensity: 'normal',
      animationSpeed: 1,
      glowIntensity: 1,
      showParticles: true,
      glassOpacity: 0.1,
      showHero: true,
      showTournaments: true,
      showLeaderboard: true,
      showStats: true,
      cardStyle: 'skeuo',
      navPosition: 'bottom',
      textTransform: 'uppercase',
      stickyHeader: true,
      showFooter: true,
      soundVolume: 0.5,
      enableTilt: true,
      fontFamily: 'Outfit',
      headingEffect: 'glow',
      theme: 'default',
      uiScale: 'full',
    };
  });



  useEffect(() => {
    localStorage.setItem('gt_app_settings', JSON.stringify(settings));
    document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    document.documentElement.style.setProperty('--font-sans', `${settings.fontFamily}, ui-sans-serif, system-ui, sans-serif`);
    document.documentElement.style.setProperty('--glow-opacity', settings.glowIntensity.toString());
    
    // Sync sound volume to audio settings
    if (settings.soundVolume !== currentAudioConfig.masterVolume) {
      updateAudioSetting('masterVolume', settings.soundVolume);
      setCurrentAudioConfig(prev => ({ ...prev, masterVolume: settings.soundVolume }));
    }
  }, [settings]);

  const [userId] = useState(() => {
    const savedId = localStorage.getItem('gt_user_id');
    if (savedId) return savedId;
    const newId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('gt_user_id', newId);
    return newId;
  });

  useEffect(() => {
    const initUser = async () => {
      try {
        const res = await fetch('/api/user/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        if (!res.ok) throw new Error("Network latency detected");
        const data = await res.json();
        setUserName(data.name || 'Agent ALPHA');
        setUserAvatar(data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`);
        setUserTags(data.tags || ["Tactician"]);
        setUserSensei(data.sensei || null);
        setCoins(data.coins);
        setFriends(data.friends || []);
        setFriendRequests(data.friendRequests || []);
        setUserHistory(data.history || []);
        setUserAchievements(data.achievements || []);
      } catch (err: any) {
        console.error("Failed to init user", err);
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [{ id, type: 'alert', title: 'SYSTEM ERROR', message: err.message || 'Initialization Failed', timestamp: Date.now() }, ...prev]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
      }
    };
    initUser();
  }, [userId]);

  const handleAddFriend = async (targetUid: string, targetName: string) => {
    try {
      if (!targetUid) throw new Error("Destination ID required for uplink");
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUid: userId, fromName: userName || "Agent ALPHA", toUid: targetUid })
      });
      if (!res.ok) throw new Error("Network disruption during broadcast");
      const data = await res.json();
      if (data.success) {
        // Notification managed by server via socket
      } else {
        throw new Error(data.error || "Uplink Failed");
      }
    } catch (err: any) {
      console.error(err);
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications(prev => [{ id, type: 'alert', title: 'UPLINK ERROR', message: err.message || 'Failed to send request', timestamp: Date.now() }, ...prev]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
    }
  };

  const handleAcceptFriend = async (req: FriendRequest) => {
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fromUid: req.fromUid, fromName: req.fromName })
      });
      if (!res.ok) throw new Error("Network disruption during synchronization");
      const data = await res.json();
      if (data.success) {
        setFriends(data.friends);
        setFriendRequests(prev => prev.filter(r => r.fromUid !== req.fromUid));
        playSuccess();
      } else {
        throw new Error(data.error || "Acceptance Failed");
      }
    } catch (err: any) {
      console.error(err);
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications(prev => [{ id, type: 'alert', title: 'SYNC ERROR', message: err.message || 'Failed to accept uplink', timestamp: Date.now() }, ...prev]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
    }
  };

  const handleRejectFriend = async (req: FriendRequest) => {
    try {
      const res = await fetch('/api/friends/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fromUid: req.fromUid })
      });
      if (!res.ok) throw new Error("Network disruption during broadcast termination");
      const data = await res.json();
      if (data.success) {
        setFriendRequests(prev => prev.filter(r => r.fromUid !== req.fromUid));
        playClick();
      } else {
        throw new Error(data.error || "Rejection Failed");
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRemoveFriend = async (friendUid: string) => {
    try {
      const res = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, friendUid })
      });
      if (!res.ok) throw new Error("Synchronization severed");
      const data = await res.json();
      if (data.success) {
        setFriends(prev => prev.filter(f => f.uid !== friendUid));
        playClick();
      } else {
        throw new Error(data.error || "De-sync Failed");
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleInvite = async (targetUid: string, tournamentTitle: string) => {
    try {
      const res = await fetch('/api/tournaments/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fromUid: userId, 
          fromName: userName || "Agent ALPHA", 
          toUid: targetUid, 
          tournamentId: "manual", 
          tournamentTitle 
        })
      });
      if (!res.ok) throw new Error("Network disruption during transmission");
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Transmission Failed");
      // Notified via socket
    } catch (err: any) {
      console.error(err);
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications(prev => [{ id, type: 'alert', title: 'INVITE ERROR', message: err.message || 'Failed to send invite', timestamp: Date.now() }, ...prev]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
    }
  };

  const handleUpdateProfile = async (updates: { name?: string, avatar?: string, tags?: string[], sensei?: SenseiData }) => {
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates })
      });
      if (!res.ok) throw new Error("Network disruption during profile update");
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update Failed");
      
      if (updates.name) setUserName(updates.name);
      if (updates.avatar) setUserAvatar(updates.avatar);
      if (updates.tags) setUserTags(updates.tags);
      if (updates.sensei) setUserSensei(updates.sensei);
      playSuccess();
    } catch (err: any) {
      console.error(err);
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications(prev => [{ id, type: 'alert', title: 'UPDATE ERROR', message: err.message || 'Failed to update profile', timestamp: Date.now() }, ...prev]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
    }
  };

  // Update effect to handle friend-related socket events
  useEffect(() => {
    if (!socketRef.current) return;

    const handleSocketNotification = (notif: AppNotification) => {
      if (notif.type === 'friend_request') {
        setFriendRequests(prev => [...prev, { fromUid: notif.data.fromUid, fromName: notif.data.fromName, timestamp: Date.now() }]);
      }
      if (notif.type === 'update' && notif.title === 'UPLINK ESTABLISHED') {
        // Refresh friends list
        const refreshUser = async () => {
           const res = await fetch('/api/user/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          const data = await res.json();
          setFriends(data.friends);
        };
        refreshUser();
      }
    };

    socketRef.current.on(`notification:${userId}`, handleSocketNotification);
    return () => {
      socketRef.current?.off(`notification:${userId}`, handleSocketNotification);
    };
  }, [userId]);

  const handleJoinSuccess = (id: string) => {
    setActiveRequestId(id);
    localStorage.setItem('gt_request_id', id);
    setSelectedTournament(null);
  };

  const clearRequest = () => {
    setActiveRequestId(null);
    localStorage.removeItem('gt_request_id');
  };

  return (
    <div 
      className={cn(
        "min-h-screen relative bg-[#020617] overflow-x-hidden",
        settings.theme !== 'default' ? `theme-${settings.theme}` : ''
      )}
      style={{
        fontFamily: settings.theme === 'minecraft' ? '"JetBrains Mono", monospace' : settings.fontFamily
      }}
    >
      <AnimatePresence mode="wait">
        {showIntro ? (
          <IntroAnimation key="intro-screen" settings={settings} onComplete={() => {
            setShowIntro(false);
            if (!localStorage.getItem('gt_onboarding_v2')) {
              setShowOnboarding(true);
            }
          }} />
        ) : (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <AnimatePresence>
              {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
            </AnimatePresence>

            <Background settings={settings} />
            <Navbar 
              coins={coins}
              avatar={userAvatar}
              onAddMoney={() => setShowAddMoney(true)}
              onRedeem={() => setShowRedeem(true)}
              onAudioClick={() => setShowAudioSettings(true)}
              onProfileClick={() => setShowProfile(true)}
              onSettingsClick={() => setShowSettings(true)}
            />

            <NotificationManager 
              notifications={notifications} 
              removeNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
            />

            <main className={cn(
              "max-w-7xl mx-auto px-6 pt-32 pb-12",
              settings.uiDensity === 'compact' ? 'space-y-12' : settings.uiDensity === 'relaxed' ? 'space-y-36' : 'space-y-24',
              settings.textTransform === 'uppercase' ? 'uppercase' : ''
            )}>
              {activeRequestId && (
                <StatusCard requestId={activeRequestId} onClear={clearRequest} />
              )}

        {/* Hero Section */}
        {settings.showHero && (
          <section className="relative flex flex-col items-center text-center space-y-8 pt-12 min-h-[70vh] justify-center">
            <div className="absolute inset-0 z-[-1] opacity-30 rounded-3xl overflow-hidden">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="https://cdn.pixabay.com/video/2020/05/25/40131-424917454_large.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "inline-flex items-center gap-2 glass px-4 py-2 text-xs font-bold tracking-widest uppercase text-primary border-primary/20",
                settings.borderRadius === 'none' ? 'rounded-none' : settings.borderRadius === 'medium' ? 'rounded-xl' : settings.borderRadius === 'full' ? 'rounded-full' : 'rounded-[2.5rem]'
              )}
            >
              <IconWrapper>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}>
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </IconWrapper>
              Season 5 Registration Open
            </motion.div>

            <motion.h1 
              className="text-4xl md:text-9xl font-black tracking-tighter leading-none font-display text-white"
            >
              <EffectText effect={settings.headingEffect}>
                {"GLENK".split("").map((char, i) => (
                  <motion.span
                    key={`hero-char-${i}`}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "backOut" }}
                    className={cn("inline-block", (char === 'G' || char === 'K') && "animate-text-shimmer")}
                  >
                    {char}
                  </motion.span>
                ))}
                <br />
                <motion.span 
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.8, duration: 1 }}
                  className="inline-block mt-4 text-white/90 animate-text-shimmer"
                >
                  TOURNAMENT
                </motion.span>
              </EffectText>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="max-w-xl text-white/50 text-sm md:text-xl font-medium px-4 leading-relaxed"
            >
              Join the community that lives and breathes competitive gaming. 
              As India's most played and loved tournament platform, GLENK GT is fully built in India 
              with one goal: to celebrate your skills and help you reach the top of the arena.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-wrap items-center justify-center gap-6 pt-12"
            >
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={playHover}
                onClick={() => { playClick(); document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={cn(
                  "skeuo-button laser-border bg-primary px-12 py-5 font-black text-sm uppercase tracking-[0.2em] text-white border border-white/10 flex items-center gap-3 shadow-2xl relative overflow-hidden group",
                  settings.borderRadius === 'none' ? 'rounded-none' : settings.borderRadius === 'medium' ? 'rounded-xl' : settings.borderRadius === 'full' ? 'rounded-full' : 'rounded-[2.5rem]'
                )}
              >
                <IconWrapper>
                  <Sword className="w-5 h-5 icon-glow" />
                </IconWrapper>
                Start Deployment
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={playHover}
                onClick={() => { playClick(); document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={cn(
                  "skeuo-button bg-white/5 px-12 py-5 font-black text-sm uppercase tracking-[0.2em] text-white/60 border border-white/5 hover:text-white transition-all shadow-xl",
                  settings.borderRadius === 'none' ? 'rounded-none' : settings.borderRadius === 'medium' ? 'rounded-xl' : settings.borderRadius === 'full' ? 'rounded-full' : 'rounded-[2.5rem]'
                )}
              >
                Tactical Intel
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={playHover}
                onClick={() => { playClick(); setShowProfile(true); }}
                className={cn(
                  "skeuo-button border border-white/10 bg-black/40 px-12 py-5 font-black text-sm uppercase tracking-[0.2em] text-white/50 hover:text-white transition-all shadow-xl",
                  settings.borderRadius === 'none' ? 'rounded-none' : settings.borderRadius === 'medium' ? 'rounded-xl' : settings.borderRadius === 'full' ? 'rounded-full' : 'rounded-[2.5rem]'
                )}
              >
                Access Dossier
              </motion.button>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 w-full max-w-4xl">
              {[
                { label: 'Active Players', value: '10K+', icon: Users },
                { label: 'Total Prize Pool', value: '₹5L+', icon: Trophy },
                { label: 'Tournaments', value: '500+', icon: Gamepad2 },
                { label: 'Fair Play', value: '100%', icon: Shield },
              ].map((stat, i) => (
                <motion.div
                  key={`hero-stat-${stat.label}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + i * 0.1 }}
                  className="flex flex-col items-center gap-2 group cursor-default"
                  onMouseEnter={playHover}
                >
                  <IconWrapper>
                    <stat.icon className="w-6 h-6 text-primary icon-glow" />
                  </IconWrapper>
                  <p className="text-2xl font-black text-glow group-hover:scale-110 transition-transform">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold group-hover:text-primary transition-colors">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Grand Arena (Main Layer) */}
        {settings.showTournaments && !tournamentsLoading && (
          <section id="tournaments" className="space-y-12">
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-16 h-1 w-primary/30 rounded-full mb-4" />
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 whileInView={{ scale: 1, opacity: 1 }}
                 className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500 border-yellow-500/20"
               >
                 Main Layer: High Stakes
               </motion.div>
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-display text-white">
                 <EffectText effect={settings.headingEffect}>
                   Grand <span className="text-yellow-500 text-glow">Arena</span>
                 </EffectText>
               </h2>
               <p className="text-white/40 font-medium max-w-xl">The pinnacle of combat. Elite rewards for the most seasoned warriors.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
               {tournaments.filter(t => t.id.startsWith('big-')).map((t, idx) => (
                  <RevealSection key={t.id} delay={idx * 0.1}>
                    <TournamentCard 
                      tournament={t} 
                      onJoin={setConfirmingTournament} 
                      headingEffect={settings.headingEffect} 
                      cardStyle={settings.cardStyle}
                      theme={settings.theme}
                    />
                  </RevealSection>
               ))}
            </div>
          </section>
        )}

        {/* Global Access Link */}
        <section className="py-12 flex justify-center">
           <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playClick(); setShowCategoryHub(true); }}
            className="group relative skeuo-button laser-border bg-primary/10 px-16 py-6 rounded-[2.5rem] border border-primary/30 flex items-center gap-4 shadow-[0_0_50px_rgba(0,240,255,0.1)] hover:bg-primary/20 transition-all"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
             <IconWrapper>
               <LayoutDashboard className="w-6 h-6 text-primary icon-glow" />
             </IconWrapper>
             <div className="text-left">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Loading Your Games</p>
               <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-glow">TOURNAMENTS</h3>
             </div>
             <ChevronRight className="w-6 h-6 text-primary/40 group-hover:translate-x-2 transition-transform" />
           </motion.button>
        </section>

      {settings.showLeaderboard && (
        <Leaderboard 
          socket={socketRef.current} 
          currentUserId={userId}
          onProfileClick={(player) => setViewedUser(player)}
          headingEffect={settings.headingEffect}
          settings={settings}
        />
      )}
        <Sponsorships />

        {/* Features Section */}
        <section className="space-y-12">
          <RevealSection direction="down">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black tracking-tighter uppercase text-wave text-glow animate-text-shimmer">
                <EffectText effect={settings.headingEffect}>
                  Why Choose <span className="text-primary">GLENK GT</span>
                </EffectText>
              </h2>
              <p className="text-white/50 font-medium">The ultimate platform for competitive gamers.</p>
            </div>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Instant Payouts', desc: 'Get your winnings directly to your wallet within 24 hours of tournament completion.', icon: Zap },
              { title: 'Anti-Cheat System', desc: 'Advanced monitoring and manual review to ensure a 100% fair gaming environment.', icon: Shield },
              { title: '24/7 Support', desc: 'Our dedicated team and AI assistant are always here to help you with any issues.', icon: MessageSquare },
            ].map((feature, i) => (
              <RevealSection key={`feature-${i}`} delay={i * 0.2}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="glass p-8 rounded-3xl space-y-4 border-white/5 hover:border-primary/30 transition-all hover:box-glow group"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors group-hover:rotate-12">
                    <IconWrapper>
                      <feature.icon className="w-6 h-6 text-primary icon-glow group-hover:scale-110 transition-transform" />
                    </IconWrapper>
                  </div>
                  <h3 className="text-xl font-black tracking-tight uppercase text-glow group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-white/50 leading-relaxed group-hover:text-white/80 transition-colors">{feature.desc}</p>
                </motion.div>
              </RevealSection>
            ))}
          </div>
        </section>
      </main>

      <footer className="glass mt-24 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <IconWrapper>
                <Crown className="text-primary w-8 h-8 icon-glow" />
            </IconWrapper>
            <span className="text-2xl font-black tracking-tighter text-glow">GLENK <span className="text-primary">GT</span></span>
          </div>
          <p className="text-white/40 text-sm font-medium">© 2026 GLENK TOURNAMENT. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-6 text-white/40 font-bold uppercase tracking-widest text-xs">
            <a href="https://instagram.com/glenk.ai2957" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">glenk.ai2957</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {(showProfile || viewedUser) && (
          <ProfileModal 
            name={viewedUser ? viewedUser.name : userName} 
            avatar={viewedUser ? undefined : userAvatar}
            tags={viewedUser ? [] : userTags}
            sensei={viewedUser ? null : userSensei}
            points={viewedUser ? viewedUser.points : coins} 
            uid={viewedUser ? viewedUser.uid : userId} 
            history={viewedUser ? [] : userHistory}
            achievements={viewedUser ? [] : userAchievements}
            isOwnProfile={!viewedUser || viewedUser.uid === userId}
            friends={friends}
            friendRequests={friendRequests}
            onAddFriend={handleAddFriend}
            onAcceptFriend={handleAcceptFriend}
            onRejectFriend={handleRejectFriend}
            onRemoveFriend={handleRemoveFriend}
            onUpdateProfile={handleUpdateProfile}
            onInvite={handleInvite}
            onClose={() => {
              setShowProfile(false);
              setViewedUser(null);
            }} 
            settings={settings}
          />
        )}
        {confirmingTournament && (
          <ConfirmTournamentModal
            tournament={confirmingTournament}
            onClose={() => setConfirmingTournament(null)}
            onConfirm={() => {
              setSelectedTournament(confirmingTournament);
              setConfirmingTournament(null);
            }}
            settings={settings}
          />
        )}
        {selectedTournament && (
          <JoinModal 
            tournament={selectedTournament} 
            onClose={() => setSelectedTournament(null)}
            onSuccess={handleJoinSuccess}
            userId={userId}
            coins={coins}
            setCoins={setCoins}
            settings={settings}
          />
        )}
        {showAudioSettings && (
          <AudioSettingsModal
            currentSettings={currentAudioConfig}
            updateSetting={(key, value) => {
              updateAudioSetting(key, value);
              setCurrentAudioConfig({ ...currentAudioConfig, [key]: value });
              if (key === 'masterVolume') {
                setSettings(prev => ({ ...prev, soundVolume: value }));
              }
            }}
            onClose={() => setShowAudioSettings(false)}
            settings={settings}
          />
        )}
        {showRedeem && (
          <RedeemModal 
            userId={userId} 
            onClose={() => setShowRedeem(false)} 
            onSuccess={(newCoins) => setCoins(newCoins)} 
            settings={settings}
          />
        )}
        {showAddMoney && (
          <AddMoneyModal 
            userId={userId} 
            onClose={() => setShowAddMoney(false)} 
            settings={settings}
          />
        )}
        {showSettings && (
          <SettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            settings={settings} 
            setSettings={setSettings} 
          />
        )}
        {showCategoryHub && (
          <CategoryHub 
            tournaments={tournaments} 
            loading={tournamentsLoading} 
            onClose={() => setShowCategoryHub(false)} 
            onJoin={setConfirmingTournament}
            feeFilter={feeFilter}
            setFeeFilter={setFeeFilter}
            modeFilter={modeFilter}
            setModeFilter={setModeFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            headingEffect={settings.headingEffect}
          />
        )}
      </AnimatePresence>


      {/* Floating Side Dock Navigation */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] hidden lg:flex flex-col gap-4">
        {[
          { id: 'home', icon: LayoutDashboard, label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
          { id: 'tournaments', icon: Trophy, label: 'Tournaments', action: () => document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' }) },
          { id: 'leaderboard', icon: Crown, label: 'Rankings', action: () => document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' }) },
          { id: 'settings', icon: Settings, label: 'Settings', action: () => setShowSettings(true) }
        ].map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { playClick(); item.action(); }}
            className="w-12 h-12 glass-dark rounded-xl border border-white/10 flex items-center justify-center group relative"
          >
            <item.icon className="w-5 h-5 text-white/40 group-hover:text-primary transition-colors" />
            <div className="absolute right-full mr-4 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg text-white text-[10px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all">
              {item.label}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-40 pb-20 px-6 border-t border-white/5 pt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 skeuo-raised rounded-2xl flex items-center justify-center border border-white/5">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter uppercase text-white leading-none">GLENK <br/><span className="text-primary">TOURNAMENTS</span></h2>
            </div>
            <p className="text-white/40 text-sm font-medium leading-relaxed">
              India's most played and loved tournament app. Built by gamers, for gamers. 
              We're proud to be 100% made in India, supporting our local champions every single day.
            </p>
            <div className="flex items-center gap-4">
              {[Twitter, Instagram, Youtube, Github].map((Icon, idx) => (
                <motion.a
                  key={idx}
                  href="#"
                  whileHover={{ scale: 1.2, y: -5 }}
                  className="w-10 h-10 skeuo-raised rounded-xl flex items-center justify-center text-white/20 hover:text-primary transition-colors border border-white/5"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Community</h3>
            <ul className="space-y-4 text-sm font-bold text-white/20">
              <li><a href="#" className="hover:text-primary transition-colors">Global Leaderboards</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Player Spotlights</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Discord Server</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tournament Schedules</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Support</h3>
            <ul className="space-y-4 text-sm font-bold text-white/20">
              <li><a href="#" className="hover:text-primary transition-colors">How to Join</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Withdrawal Guide</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Fair Play Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Our Mission</h3>
            <p className="text-white/20 text-xs leading-relaxed uppercase tracking-widest font-black italic">
              "TO EMPOWER EVERY INDIVIDUAL INDIAN GAMER WITH THE TOOLS TO COMPETE AT THE GLOBAL LEVEL."
            </p>
            <div className="p-4 skeuo-pressed rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Secure & Verified Platform</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} GLENK TOURNAMENTS. ALL RIGHTS RESERVED.
          </p>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 text-center md:text-left">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">Crafted by</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] skeuo-text">Glenk Studio</span>
                </div>
                <p className="text-[8px] font-bold text-white/5 uppercase tracking-widest max-w-[200px]">
                  India's leading studio for high-performance esports infrastructure and player-first experiences.
                </p>
              </div>
              <div className="flex items-center gap-6">
              <a href="#" className="text-[9px] font-bold text-white/10 uppercase tracking-widest hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-[9px] font-bold text-white/10 uppercase tracking-widest hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CategoryHub = ({ 
  tournaments, 
  loading, 
  onClose, 
  onJoin,
  feeFilter,
  setFeeFilter,
  modeFilter,
  setModeFilter,
  typeFilter,
  setTypeFilter,
  searchTerm,
  setSearchTerm,
  headingEffect
}: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className="fixed inset-0 z-[8000] bg-black/90 flex flex-col pt-32 px-6 overflow-y-auto"
    >
      <div className="max-w-7xl mx-auto w-full space-y-16 pb-40">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-4">
             <motion.button 
               onClick={() => { playClick(); onClose(); }}
               className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 hover:text-primary transition-colors mb-4 group"
             >
               <ArrowDownLeft className="w-4 h-4 rotate-45 group-hover:-translate-x-1 transition-transform" /> Back to Main Layer
             </motion.button>
             <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase font-display text-white">Ops <span className="text-primary text-glow">Hub</span></h2>
             <p className="text-white/40 font-medium max-w-2xl leading-relaxed">System-wide tactical overview. Access categorized Battle Rooms, Clash Squad sectors, and Lone Wolf training zones.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <div className="relative group w-full sm:w-96">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="PROBE NODES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#050505] border border-white/5 rounded-2xl pl-16 pr-6 py-6 focus:outline-none focus:border-primary/50 transition-all text-sm font-black uppercase tracking-[0.2em] skeuo-pressed"
              />
            </div>
            <button 
              onClick={onClose}
              className="skeuo-raised p-6 rounded-2xl text-white/20 hover:text-white transition-all shadow-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Granular Filter Groups */}
        <div className="space-y-8">
          {/* Group 1: Entry Fee */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Tournament Prize Pool</p>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'FREE', '₹199', '₹499', '₹1999'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => { playClick(); setFeeFilter(cat); }}
                  className={cn(
                    "px-6 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] border transition-all duration-300",
                    feeFilter === cat 
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Group 2: Game Mode */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Combat Mode</p>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'Solo', 'Duo', 'Squad'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => { playClick(); setModeFilter(mode); }}
                  className={cn(
                    "px-6 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] border transition-all duration-300",
                    modeFilter === mode
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Group 3: Tournament Type */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Sector Type</p>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'BR', 'CS', 'Lone Wolf'].map((type) => (
                <button
                  key={type}
                  onClick={() => { playClick(); setTypeFilter(type); }}
                  className={cn(
                    "px-6 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] border transition-all duration-300",
                    typeFilter === type
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {loading ? (
            [...Array(12)].map((_, i) => <TournamentSkeleton key={`skeleton-hub-${i}`} settings={settings} />)
          ) : (
            (() => {
              let filtered = tournaments.filter((t: any) => !t.id.startsWith('big-'));
              
              if (searchTerm) {
                filtered = filtered.filter((t: any) => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
              }

              // Apply Fee Filter
              if (feeFilter !== 'ALL') {
                filtered = filtered.filter((t: any) => {
                  if (feeFilter === 'FREE') return t.entryFee === 0;
                  if (feeFilter === '₹199') return t.entryFee === 199;
                  if (feeFilter === '₹499') return t.entryFee === 499;
                  if (feeFilter === '₹1999') return t.entryFee === 1999;
                  return true;
                });
              }

              // Apply Mode Filter
              if (modeFilter !== 'ALL') {
                filtered = filtered.filter((t: any) => t.type === modeFilter);
              }

              // Apply Type Filter
              if (typeFilter !== 'ALL') {
                filtered = filtered.filter((t: any) => t.title.toLowerCase().includes(typeFilter.toLowerCase()));
              }

              return filtered.map((t: any, idx: number) => (
                <RevealSection key={`hub-tourn-${t.id}`} delay={idx * 0.05} direction="up">
                  <TournamentCard 
                    tournament={t} 
                    onJoin={onJoin} 
                    headingEffect={headingEffect} 
                    cardStyle={settings.cardStyle}
                    theme={settings.theme}
                  />
                </RevealSection>
              ));
            })()
          )}
        </div>

        {!loading && (
          (() => {
            let filtered = tournaments.filter((t: any) => !t.id.startsWith('big-'));
            if (feeFilter !== 'ALL') {
              filtered = filtered.filter((t: any) => {
                if (feeFilter === 'FREE') return t.entryFee === 0;
                if (feeFilter === '₹199') return t.entryFee === 199;
                if (feeFilter === '₹499') return t.entryFee === 499;
                if (feeFilter === '₹1999') return t.entryFee === 1999;
                return true;
              });
            }
            if (modeFilter !== 'ALL') filtered = filtered.filter((t: any) => t.type === modeFilter);
            if (typeFilter !== 'ALL') filtered = filtered.filter((t: any) => t.title.toLowerCase().includes(typeFilter.toLowerCase()));
            if (searchTerm) filtered = filtered.filter((t: any) => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return filtered.length === 0;
          })()
        ) && (
          <div className="py-40 text-center space-y-6">
            <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 skeuo-raised border border-white/5 animate-pulse">
              <Search className="w-12 h-12 text-primary/40" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-widest text-white/40">Zero Tactical Matches</h3>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20">We couldn't find any tournaments matching your search. Try adjusting the filters!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
