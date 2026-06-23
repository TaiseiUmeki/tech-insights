'use client';

import { useEffect, useState } from 'react';

interface SideNavItem {
  id: string;
  label: string;
}

interface SideNavSection {
  category: string;
  items: SideNavItem[];
}

interface SideNavProps {
  sections: SideNavSection[];
}

export function SideNav({ sections }: SideNavProps) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const ids = sections.flatMap((s) => s.items.map((i) => i.id));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className='sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto'>
      <div className='space-y-5'>
        {sections.map((section) => (
          <div key={section.category}>
            <p className='mb-2 border-b border-border/50 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70'>
              {section.category}
            </p>
            <ul className='space-y-px'>
              {section.items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`block rounded-md px-2.5 py-1.5 text-[13px] transition-all ${
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
