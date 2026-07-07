import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: (i * 71) % 100,
  size: 3 + ((i * 13) % 5),
  duration: 22 + ((i * 7) % 18),
  delay: -((i * 5) % 20),
  opacity: 0.15 + ((i * 3) % 10) / 40,
}));

export function AnimatedBackground({ interactive = true }: { interactive?: boolean }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!interactive) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX - 200);
      my.set(e.clientY - 200);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [interactive, mx, my]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Grid */}
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black_35%,transparent_100%)]" />

      {/* Gradient blobs */}
      <div className="animate-float-slow absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary-glow/25 blur-3xl" />
      <div
        className="animate-float-slow absolute top-1/3 -right-40 h-[26rem] w-[26rem] rounded-full bg-accent/60 blur-3xl"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="animate-float-slow absolute -bottom-40 left-1/4 h-[24rem] w-[24rem] rounded-full bg-primary-soft blur-3xl"
        style={{ animationDelay: "-12s" }}
      />

      {/* Mouse-reactive glow */}
      {interactive && mounted && (
        <motion.div
          className="absolute h-[400px] w-[400px] rounded-full bg-primary-glow/15 blur-3xl"
          style={{ x: sx, y: sy }}
        />
      )}

      {/* Floating particles */}
      {mounted &&
        PARTICLES.map((p) => (
          <span
            key={p.id}
            className="absolute bottom-0 rounded-full bg-primary/40"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animation: `particle-drift ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
    </div>
  );
}