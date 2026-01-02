import { useEffect, useRef, useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

// 3D Floating Sphere Component
function FloatingSphere({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      gsap.to(meshRef.current.rotation, {
        y: Math.PI * 2,
        duration: 20,
        repeat: -1,
        ease: 'none',
      });
    }
  }, []);

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.8} 
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </Float>
  );
}

// Animated particles
function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 500;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, []);
  
  useEffect(() => {
    if (particlesRef.current) {
      gsap.to(particlesRef.current.rotation, {
        y: Math.PI * 2,
        duration: 100,
        repeat: -1,
        ease: 'none',
      });
    }
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial size={0.05} color="#ff6b6b" sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

// Hero 3D Scene
function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ff6b6b" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4ecdc4" />
      <spotLight position={[0, 20, 0]} angle={0.3} penumbra={1} intensity={2} color="#ffd93d" />
      
      <Particles />
      
      <FloatingSphere position={[-4, 2, -5]} color="#ff6b6b" scale={1.5} />
      <FloatingSphere position={[5, -1, -3]} color="#4ecdc4" scale={1} />
      <FloatingSphere position={[0, -3, -8]} color="#ffd93d" scale={2} />
      <FloatingSphere position={[-6, -2, -6]} color="#a855f7" scale={0.8} />
      <FloatingSphere position={[4, 3, -4]} color="#06b6d4" scale={0.6} />
      
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

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
      className="relative group cursor-pointer perspective-1000"
      whileHover={{ scale: 1.05, rotateY: 5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />
      <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full overflow-hidden">
        {/* Animated border */}
        <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-3xl`} />
        
        {/* Floating number */}
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

// Main Portfolio Component
const Portfolio = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  
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
    // Cinematic page entrance
    const tl = gsap.timeline();
    tl.fromTo(
      '.hero-title',
      { opacity: 0, y: 100, skewY: 10 },
      { opacity: 1, y: 0, skewY: 0, duration: 1.5, ease: 'power4.out' }
    )
    .fromTo(
      '.hero-subtitle',
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
      '-=0.8'
    )
    .fromTo(
      '.hero-cta',
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' },
      '-=0.5'
    );
    
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-black min-h-screen overflow-x-hidden">
      {/* Custom cursor follower */}
      <motion.div
        className="fixed w-8 h-8 rounded-full border-2 border-pink-500 pointer-events-none z-50 mix-blend-difference"
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
      <motion.section
        ref={heroRef}
        className="h-screen relative flex items-center justify-center overflow-hidden"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* 3D Background */}
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
            <Suspense fallback={null}>
              <HeroScene />
            </Suspense>
          </Canvas>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-8">
          <motion.div
            className="overflow-hidden mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h1 className="hero-title text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 tracking-tighter">
              NOA WILHIDE
            </h1>
          </motion.div>
          
          <p className="hero-subtitle text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Franco-American developer passionate about{' '}
            <span className="text-pink-500">AI</span>,{' '}
            <span className="text-purple-500">creative coding</span>, and{' '}
            <span className="text-cyan-500">interactive experiences</span>
          </p>
          
          <motion.div 
            className="hero-cta flex flex-wrap gap-4 justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <button className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white font-bold text-lg hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300">
              View Projects
            </button>
            <button className="px-8 py-4 border-2 border-white/20 rounded-full text-white font-bold text-lg hover:bg-white/10 hover:border-white/40 transition-all duration-300">
              Contact Me
            </button>
          </motion.div>
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
      </motion.section>
      
      {/* About Section */}
      <section className="min-h-screen py-32 px-8 relative">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-5xl md:text-7xl font-bold text-white mb-16"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: 'power3.out' }}
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
            transition={{ duration: 1, ease: 'power3.out' }}
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
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500">© 2024 Noa Wilhide. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portfolio;
