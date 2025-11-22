import React, { useEffect, useRef } from 'react';

const SmokeEffect = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<any[]>([]);
    const mouse = useRef({ x: 0, y: 0 });
    const lastMouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const handleMouseMove = (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };

            // Create particles on move
            const distance = Math.hypot(mouse.current.x - lastMouse.current.x, mouse.current.y - lastMouse.current.y);
            const particleCount = Math.min(Math.max(Math.floor(distance / 2), 1), 5); // More particles for faster movement

            for (let i = 0; i < particleCount; i++) {
                particles.current.push({
                    x: mouse.current.x + (Math.random() - 0.5) * 10,
                    y: mouse.current.y + (Math.random() - 0.5) * 10,
                    size: Math.random() * 15 + 5,
                    speedX: (Math.random() - 0.5) * 1,
                    speedY: (Math.random() - 1) * 1 - 0.5, // Drift up
                    life: 1,
                    decay: Math.random() * 0.02 + 0.01,
                    color: `hsla(0, 0%, 80%, ${Math.random() * 0.2 + 0.1})` // Smokey gray
                });
            }

            lastMouse.current = { ...mouse.current };
        };

        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.current.length; i++) {
                const p = particles.current[i];

                ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.life})`);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                p.x += p.speedX;
                p.y += p.speedY;
                p.size *= 0.98; // Shrink slightly
                p.life -= p.decay;

                if (p.life <= 0 || p.size <= 0.5) {
                    particles.current.splice(i, 1);
                    i--;
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};

export default SmokeEffect;
