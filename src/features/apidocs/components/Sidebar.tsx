import React from 'react';
import { SIDEBAR_SECTIONS } from '../data/sections';

export function Sidebar() {
  return (
    <nav className="apidoc-sidebar" aria-label="Sommaire de la documentation">
      {SIDEBAR_SECTIONS.map(section => (
        <div key={section.label} className="apidoc-sidebar__section">
          <p className="apidoc-sidebar__label">{section.label}</p>
          {section.links.map(link => (
            <a key={link.href} href={link.href} className="apidoc-sidebar__link">
              {link.label}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}
