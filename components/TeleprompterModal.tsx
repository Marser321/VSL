import { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, FastForward, Rewind } from 'lucide-react';
import type { BloqueVSL } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TeleprompterProps {
  isOpen: boolean;
  onClose: () => void;
  bloques: BloqueVSL[];
  hookActual: any;
}

export function TeleprompterModal({ isOpen, onClose, bloques, hookActual }: TeleprompterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.5);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const scroll = (timestamp: number) => {
      if (isPlaying && scrollRef.current) {
        const deltaTime = timestamp - lastTime;
        // Ajustamos la velocidad según deltaTime para que sea suave independientemente de los FPS
        scrollRef.current.scrollTop += (speed * deltaTime * 0.05);
      }
      lastTime = timestamp;
      animationFrameId = requestAnimationFrame(scroll);
    };

    if (isPlaying) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(scroll);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, speed]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] grid grid-rows-[auto_1fr] bg-black text-white p-4">
      {/* Ctlr Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsPlaying(!isPlaying)} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            {isPlaying ? <Pause className="mr-2" size={16} /> : <Play className="mr-2" size={16} />}
            {isPlaying ? 'Pausar' : 'Reproducir'}
          </Button>
          
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white" onClick={() => setSpeed(Math.max(0.5, speed - 0.5))}>
              <Rewind size={14} />
            </Button>
            <span className="text-xs font-mono w-16 text-center">x{speed}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white" onClick={() => setSpeed(Math.min(5, speed + 0.5))}>
              <FastForward size={14} />
            </Button>
          </div>
        </div>

        <Button onClick={onClose} variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10">
          <X size={20} />
        </Button>
      </div>

      {/* Prompter Canvas */}
      <div ref={scrollRef} className="overflow-y-auto w-full max-w-4xl mx-auto px-4 py-32 prompt-container" style={{ scrollBehavior: 'auto' }}>
        <div className="text-[5vw] md:text-[4rem] font-bold leading-tight space-y-16" style={{ fontFamily: 'sans-serif' }}>
          {hookActual && (
            <div className="text-yellow-400">
              {hookActual.texto}
            </div>
          )}
          {bloques.map((b) => (
            <div key={b.id} className="whitespace-pre-wrap">
              {b.texto}
            </div>
          ))}
          <div className="h-[50vh]"></div>
        </div>
      </div>
    </div>
  );
}
