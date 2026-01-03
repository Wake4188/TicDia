import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Project Card
interface Project {
  title: string;
  description: string;
  tech: string[];
  gradient: string;
}

const projects: Project[] = [
  {
    title: 'AI Rock–Paper–Scissors',
    description: 'Hand gesture recognition model using computer vision. Real-time detection with high accuracy.',
    tech: ['Python', 'TensorFlow', 'OpenCV', 'MediaPipe'],
    gradient: 'from-pink-500 via-red-500 to-yellow-500',
  },
  {
    title: 'TicDia',
    description: 'TikTok-style Wikipedia reader. Infinite scroll through curated knowledge articles.',
    tech: ['React', 'TypeScript', 'Supabase', 'Framer Motion'],
    gradient: 'from-cyan-500 via-blue-500 to-purple-500',
  },
  {
    title: 'Youth Council Tech',
    description: 'Digital communication platform for local government youth initiatives.',
    tech: ['React', 'Node.js', 'PostgreSQL', 'Figma'],
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
  },
  {
    title: 'Creative Coding Lab',
    description: 'Experimental web animations and interactive art installations.',
    tech: ['Three.js', 'GSAP', 'WebGL', 'Canvas'],
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
  },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { 
          opacity: 0, 
          y: 100, 
          rotateX: -15,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 80%',
            end: 'top 50%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className="relative group cursor-pointer"
      style={{ perspective: 1000 }}
      whileHover={{ scale: 1.05, rotateY: 5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />
      <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-3xl`} />
        
        <span className="absolute top-4 right-4 text-8xl font-bold text-white/5 group-hover:text-white/10 transition-colors duration-500">
          0{index + 1}
        </span>
        
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-500">
            {project.title}
          </h3>
          <p className="text-gray-400 mb-6 leading-relaxed">{project.description}</p>
          <div className="flex flex-wrap gap-2">
            {project.tech.map((t, i) => (
              <span
                key={i}
                className="px-3 py-1 text-xs font-medium bg-white/5 border border-white/10 rounded-full text-gray-300 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Skills section
const skills = [
  { name: 'Java', level: 90 },
  { name: 'Python', level: 85 },
  { name: 'Swift', level: 75 },
  { name: 'TypeScript', level: 88 },
  { name: 'React', level: 90 },
  { name: 'Three.js/WebGL', level: 70 },
  { name: 'GSAP', level: 85 },
  { name: 'AI/ML', level: 75 },
];

function SkillBar({ skill, index }: { skill: { name: string; level: number }; index: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (barRef.current) {
      gsap.fromTo(
        barRef.current,
        { scaleX: 0, transformOrigin: 'left' },
        {
          scaleX: 1,
          duration: 1.5,
          delay: index * 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: barRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  }, [index]);

  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-white font-medium">{skill.name}</span>
        <span className="text-gray-400">{skill.level}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full"
          style={{ width: `${skill.level}%` }}
        />
      </div>
    </div>
  );
}

// Animated background particles (CSS-based, no Three.js)
function ParticleBackground() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-30"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Main Portfolio Component
const Portfolio = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useEffect(() => {
    // Kill any existing ScrollTrigger instances on unmount
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-black min-h-screen overflow-x-hidden overflow-y-auto">
      {/* CSS-based particle background */}
      <ParticleBackground />
      
      {/* Custom cursor follower */}
      <motion.div
        className="fixed w-8 h-8 rounded-full border-2 border-pink-500 pointer-events-none z-50 mix-blend-difference hidden md:block"
        animate={{
          x: mousePosition.x * 20,
          y: mousePosition.y * 20,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="h-screen relative flex items-center justify-center overflow-hidden"
      >
        {/* Gradient orbs background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute w-96 h-96 rounded-full bg-pink-500/30 blur-3xl"
            animate={{ 
              x: [0, 100, 0], 
              y: [0, -50, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            style={{ left: '20%', top: '30%' }}
          />
          <motion.div 
            className="absolute w-80 h-80 rounded-full bg-cyan-500/30 blur-3xl"
            animate={{ 
              x: [0, -80, 0], 
              y: [0, 80, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            style={{ right: '20%', top: '40%' }}
          />
          <motion.div 
            className="absolute w-64 h-64 rounded-full bg-purple-500/30 blur-3xl"
            animate={{ 
              x: [0, 50, 0], 
              y: [0, 100, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ left: '50%', bottom: '20%' }}
          />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-8">
          <div className="overflow-hidden mb-4">
            <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 tracking-tighter animate-fade-in">
              NOA WILHIDE
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Franco-American developer passionate about{' '}
            <span className="text-pink-500">AI</span>,{' '}
            <span className="text-purple-500">creative coding</span>, and{' '}
            <span className="text-cyan-500">interactive experiences</span>
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <button className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white font-bold text-lg hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300">
              View Projects
            </button>
            <button className="px-8 py-4 border-2 border-white/20 rounded-full text-white font-bold text-lg hover:bg-white/10 hover:border-white/40 transition-all duration-300">
              Contact Me
            </button>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-8 h-12 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
          </div>
        </motion.div>
      </section>
      
      {/* About Section */}
      <section className="min-h-screen py-32 px-8 relative">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-5xl md:text-7xl font-bold text-white mb-16"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Me</span>
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                I'm a Franco-American student based in <span className="text-cyan-400">Colomiers, France</span>, 
                driven by a deep passion for programming, artificial intelligence, and creative technology.
              </p>
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                Bilingual in <span className="text-pink-400">French</span> and{' '}
                <span className="text-purple-400">English</span>, with German as a second language, 
                I bridge cultures through code and creativity.
              </p>
              <p className="text-xl text-gray-300 leading-relaxed">
                When I'm not coding, you'll find me experimenting with motion design, 
                creating animated web experiences, or contributing to youth council tech initiatives.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {skills.map((skill, i) => (
                <SkillBar key={skill.name} skill={skill} index={i} />
              ))}
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Projects Section */}
      <section className="min-h-screen py-32 px-8 relative">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-5xl md:text-7xl font-bold text-white mb-16"
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">Projects</span>
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <ProjectCard key={project.title} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <section className="min-h-screen py-32 px-8 relative flex items-center">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-5xl md:text-7xl font-bold text-white mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            Let's Create{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">
              Something Amazing
            </span>
          </motion.h2>
          
          <motion.p
            className="text-xl text-gray-400 mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Open for collaborations, projects, and opportunities
          </motion.p>
          
          <motion.a
            href="mailto:contact@noawilhide.dev"
            className="inline-block px-12 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full text-white font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 hover:scale-105"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
          >
            Get In Touch →
          </motion.a>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500">© 2024 Noa Wilhide. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
              GitHub
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;
