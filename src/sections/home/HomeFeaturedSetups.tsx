import React, { useMemo, useRef, useEffect } from 'react';
import { useGsap, gsap } from '../../motion/useGsap';
import { ArrowRight } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useSiteContent } from '../../content.context';
import { t } from '../../content';

const fallbackProjects = [
  {
    title: 'Formula 1 Azerbaijan GP',
    location: 'Baku City Circuit',
    category: 'Technical Production',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1000',
    year: '2025'
  },
  {
    title: 'COP29 World Summit',
    location: 'Baku Olympic Stadium',
    category: 'Full Audio-Visual',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000',
    year: '2024'
  },
  {
    title: 'Baku Jazz Festival',
    location: 'Heydar Aliyev Center',
    category: 'Lighting Design',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1000',
    year: '2024'
  },
  {
    title: 'National Day Celebration',
    location: 'National Boulevard',
    category: 'LED Wall Systems',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1000',
    year: '2025'
  },
];

const ProjectCard = ({ project }: { project: any }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  // Cache rect — only update on mount/resize, not every mousemove
  const rectRef = useRef<DOMRect | null>(null);
  const updateRect = () => { rectRef.current = cardRef.current?.getBoundingClientRect() ?? null; };
  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = rectRef.current;
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="project-card relative group shrink-0 w-[80vw] md:w-[60vw] lg:w-[45vw] h-[60vh] rounded-[2.75rem] overflow-hidden bg-brand-card border border-white/8 shadow-[0_28px_80px_rgba(0,0,0,0.32)] perspective-1000"
    >
      <motion.div
        style={{ transform: "translateZ(50px)" }}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <img
          src={project.image}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
          alt={project.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10 opacity-90" />
      </motion.div>

      <div className="absolute inset-0 border-18 border-transparent group-hover:border-white/6 transition-all duration-700 pointer-events-none" />

      <motion.div
        style={{ transform: "translateZ(80px)" }}
        className="project-info absolute bottom-10 left-10 right-10 md:bottom-12 md:left-12 md:right-12 flex justify-between items-end pointer-events-none"
      >
        <div className="space-y-4 md:space-y-5">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="px-3 py-1 bg-premium-orange/18 border border-premium-orange/35 text-premium-orange text-[9px] font-black uppercase tracking-[0.22em] rounded-full backdrop-blur-sm">
              {project.category}
            </span>
            <span className="text-white/55 text-[9px] font-black uppercase tracking-[0.22em]">{project.year}</span>
          </div>
          <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-ultra-tight leading-[0.94]">
            {project.title}
          </h3>
          <p className="text-white/65 font-bold uppercase tracking-[0.22em] text-[10px] leading-relaxed">{project.location}</p>
        </div>

        <button className="w-14 h-14 rounded-full glass flex items-center justify-center text-white hover:bg-premium-orange hover:text-white transition-all duration-300 transform group-hover:rotate-45 pointer-events-auto shadow-[0_14px_36px_rgba(0,0,0,0.2)]">
          <ArrowRight className="w-6 h-6" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default function HomeFeaturedSetups() {
  const component = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLDivElement>(null);
  const { content, locale } = useSiteContent();

  const projects = useMemo(() => {
    const contentProjects = content.home.featuredSetups.projects || [];
    if (!contentProjects.length) {
      return fallbackProjects;
    }

    return contentProjects.map((project) => ({
      title: t(locale, project.title),
      location: t(locale, project.location),
      category: t(locale, project.category),
      image: project.image,
      year: project.year,
    }));
  }, [content.home.featuredSetups.projects, locale]);

  useGsap(() => {
    const totalWidth = slider.current?.scrollWidth || 0;
    const windowWidth = window.innerWidth;

    gsap.to(slider.current, {
      x: () => -(totalWidth - windowWidth),
      ease: 'none',
      scrollTrigger: {
        trigger: component.current,
        pin: true,
        scrub: 1.1,
        start: 'top top',
        end: () => `+=${totalWidth}`,
        anticipatePin: 1,
      }
    });

    // Use scaleX instead of width to avoid layout reflow on every scrub frame
    gsap.to('#horizontal-progress', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: component.current,
        start: 'top top',
        end: () => `+=${totalWidth}`,
        scrub: 1.1,
      }
    });

    gsap.from('.portfolio-header', {
      scrollTrigger: {
        trigger: component.current,
        start: 'top 80%',
      },
      y: 40,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out'
    });
  }, { scope: component });

  return (
    <div ref={component} className="overflow-hidden bg-brand-bg relative">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="grid-vertical left-[40%] opacity-20" />
        <div className="grid-vertical left-[60%] opacity-20" />
      </div>

      <div className="portfolio-header flex items-center px-6 md:px-12 h-[28vh] md:h-[30vh] relative z-10">
        <div className="flex flex-col gap-3">
          <span className="text-premium-orange text-[10px] font-black uppercase tracking-[0.26em]">{t(locale, content.home.featuredSetups.badge)}</span>
          <h2 className="text-7xl md:text-9xl font-black uppercase tracking-ultra-tight leading-[0.94]">
            {t(locale, content.home.featuredSetups.title)} <span className="text-stroke-solid">{t(locale, content.home.featuredSetups.titleAccent)}</span>
          </h2>
        </div>
      </div>

      <div
        ref={slider}
        className="flex gap-10 md:gap-12 px-6 md:px-12 h-[70vh] w-fit items-center relative z-10 will-change-transform"
      >
        {projects.map((project, i) => (
          <ProjectCard key={i} project={project} />
        ))}

        <div className="shrink-0 w-[40vw] h-[60vh] flex flex-col items-center justify-center gap-6 md:gap-8 group cursor-pointer">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-premium-orange group-hover:border-premium-orange transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
            <ArrowRight className="w-10 h-10 text-white" />
          </div>
          <p className="text-2xl font-black uppercase tracking-ultra-tight text-white/45 group-hover:text-white transition-colors duration-300">
            {t(locale, content.home.featuredSetups.viewAll)}
          </p>
        </div>
      </div>

      <div className="absolute bottom-10 md:bottom-12 left-6 md:left-12 right-6 md:right-12 z-20 h-px bg-white/10">
        <motion.div
          className="absolute top-0 left-0 h-full w-full bg-premium-orange origin-left"
          style={{ scaleX: 0 }}
          id="horizontal-progress"
        />
      </div>
    </div>
  );
}