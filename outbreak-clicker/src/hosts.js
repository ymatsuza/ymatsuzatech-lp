// Per-tier "host" backdrop silhouettes. Each is drawn twice via <use>: a dark
// base and a red "infected" copy that is clipped by a bottom-up rect whose
// height the UI drives from tierProgress (host reddens as it fills).

const SHAPES = {
  // 臓器: lungs (trachea + two lobes)
  0: `<g fill="currentColor">
        <rect x="95" y="32" width="10" height="36" rx="4"/>
        <path d="M98 60 C70 64 52 96 56 140 C58 166 84 172 92 148 C99 124 99 92 98 60 Z"/>
        <path d="M102 60 C130 64 148 96 144 140 C142 166 116 172 108 148 C101 124 101 92 102 60 Z"/>
      </g>`,
  // 人間: body silhouette
  1: `<g fill="currentColor">
        <circle cx="100" cy="38" r="17"/>
        <path d="M100 58 C82 58 72 71 72 92 L67 150 q-2 17 10 17 q10 0 11 -15 l4 -40 h12 l4 40 q1 15 11 15 q12 0 10 -17 L128 92 C128 71 118 58 100 58 Z"/>
      </g>`,
  // 国: landmass blob with city dots
  2: `<g fill="currentColor">
        <path d="M40 72 Q60 50 90 57 Q122 47 150 67 Q174 82 162 112 Q170 142 138 151 Q108 167 80 152 Q44 149 38 117 Q30 92 40 72 Z"/>
      </g>`,
  // 世界: globe
  3: `<g fill="currentColor"><circle cx="100" cy="100" r="70"/></g>`,
  // 宇宙: planet + moons + stars
  4: `<g fill="currentColor">
        <circle cx="100" cy="104" r="46"/>
        <circle cx="151" cy="58" r="9"/><circle cx="52" cy="60" r="6"/><circle cx="158" cy="122" r="5"/><circle cx="44" cy="132" r="7"/>
        <rect x="70" y="38" width="4" height="4"/><rect x="132" y="150" width="4" height="4"/><rect x="38" y="96" width="3" height="3"/>
      </g>`,
  // 銀河: tilted disk with a bulge
  5: `<g fill="currentColor" transform="rotate(-25 100 100)">
        <ellipse cx="100" cy="100" rx="74" ry="22"/>
        <ellipse cx="100" cy="100" rx="30" ry="30"/>
        <ellipse cx="150" cy="100" rx="14" ry="6"/><ellipse cx="50" cy="100" rx="14" ry="6"/>
      </g>`,
  // マルチバース: overlapping universe bubbles
  6: `<g fill="currentColor">
        <circle cx="80" cy="90" r="40"/><circle cx="126" cy="80" r="30"/>
        <circle cx="116" cy="126" r="34"/><circle cx="66" cy="136" r="22"/><circle cx="150" cy="120" r="18"/>
      </g>`,
};

export function hostSvg(tierIndex) {
  const shape = SHAPES[tierIndex] ?? SHAPES[3];
  return `<svg viewBox="0 0 200 200" class="host-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <g id="hostShape">${shape}</g>
      <clipPath id="hostFill"><rect id="hostFillRect" x="0" y="200" width="200" height="0"/></clipPath>
    </defs>
    <use href="#hostShape" style="color:#241210"/>
    <use href="#hostShape" style="color:#e23b2e" opacity="0.92" clip-path="url(#hostFill)"/>
  </svg>`;
}

/** Update the bottom-up infection fill (progress 0..1) on an already-rendered host. */
export function setHostFill(container, progress) {
  const rect = container.querySelector('#hostFillRect');
  if (!rect) return;
  const h = Math.max(0, Math.min(1, progress)) * 200;
  rect.setAttribute('y', String(200 - h));
  rect.setAttribute('height', String(h));
}
