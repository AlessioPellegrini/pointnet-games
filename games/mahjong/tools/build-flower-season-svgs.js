'use strict';
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'assets');

const items = [
  {
    id: 'Flower1', num: 1, type: 'flower', name: 'PLUM', char: '梅', color: '#b93c3c', darkColor: '#ff5252',
    svgContent: `
    <!-- Plum Blossom Branch & Flowers -->
    <path d="M-70,30 Q-25,5 0,-15 T70,-45" fill="none" stroke="#5d4037" stroke-width="7" stroke-linecap="round"/>
    <path d="M-20,10 Q-38,-20 -50,-35" fill="none" stroke="#5d4037" stroke-width="5" stroke-linecap="round"/>
    <path d="M20,-20 Q40,-5 58,12" fill="none" stroke="#5d4037" stroke-width="4" stroke-linecap="round"/>
    <g transform="translate(0, -15)">
      <circle cx="0" cy="-22" r="18" fill="%%PETAL%%"/>
      <circle cx="21" cy="-7" r="18" fill="%%PETAL%%"/>
      <circle cx="13" cy="18" r="18" fill="%%PETAL%%"/>
      <circle cx="-13" cy="18" r="18" fill="%%PETAL%%"/>
      <circle cx="-21" cy="-7" r="18" fill="%%PETAL%%"/>
      <circle cx="0" cy="0" r="12" fill="%%CENTER_BG%%"/>
      <circle cx="0" cy="0" r="6" fill="%%GOLD%%"/>
    </g>
    <g transform="translate(-50, -35)"><circle cx="-4" cy="-6" r="10" fill="%%PETAL%%"/><circle cx="6" cy="-4" r="10" fill="%%PETAL%%"/><circle cx="0" cy="5" r="10" fill="%%PETAL%%"/><circle cx="0" cy="0" r="3" fill="%%GOLD%%"/></g>
    <g transform="translate(58, 12)"><circle cx="-4" cy="-4" r="9" fill="%%PETAL%%"/><circle cx="5" cy="-4" r="9" fill="%%PETAL%%"/><circle cx="0" cy="5" r="9" fill="%%PETAL%%"/><circle cx="0" cy="0" r="3" fill="%%GOLD%%"/></g>`
  },
  {
    id: 'Flower2', num: 2, type: 'flower', name: 'ORCHID', char: '蘭', color: '#b93c3c', darkColor: '#ff5252',
    svgContent: `
    <!-- Orchid Blossom & Graceful Leaves -->
    <path d="M-60,45 C-40,-10 -10,-40 20,-55" fill="none" stroke="#2e7d32" stroke-width="6" stroke-linecap="round"/>
    <path d="M-35,45 C-15,10 15,-20 65,-30" fill="none" stroke="#2e7d32" stroke-width="5" stroke-linecap="round"/>
    <g transform="translate(10, -25)">
      <!-- Orchid Petals -->
      <path d="M0,0 C-25,-35 -5,-65 0,-60 C5,-65 25,-35 0,0" fill="%%PETAL%%"/>
      <path d="M0,0 C-45,-15 -60,10 -50,15 C-40,20 -15,5 0,0" fill="%%PETAL%%"/>
      <path d="M0,0 C45,-15 60,10 50,15 C40,20 15,5 0,0" fill="%%PETAL%%"/>
      <!-- Lip / Center -->
      <path d="M-12,5 C-18,25 0,35 12,25 C18,15 5,5 0,5" fill="%%GOLD%%"/>
      <circle cx="0" cy="15" r="4" fill="#d84315"/>
    </g>`
  },
  {
    id: 'Flower3', num: 3, type: 'flower', name: 'CHRYS', char: '菊', color: '#b93c3c', darkColor: '#ff5252',
    svgContent: `
    <!-- Chrysanthemum radiating blossom -->
    <path d="M0,45 Q-10,10 0,-10" fill="none" stroke="#2e7d32" stroke-width="6" stroke-linecap="round"/>
    <g transform="translate(0, -15)">
      <ellipse cx="0" cy="-30" rx="6" ry="16" fill="%%PETAL%%"/>
      <ellipse cx="21" cy="-21" rx="6" ry="16" transform="rotate(45 21 -21)" fill="%%PETAL%%"/>
      <ellipse cx="30" cy="0" rx="6" ry="16" transform="rotate(90 30 0)" fill="%%PETAL%%"/>
      <ellipse cx="21" cy="21" rx="6" ry="16" transform="rotate(135 21 21)" fill="%%PETAL%%"/>
      <ellipse cx="0" cy="30" rx="6" ry="16" fill="%%PETAL%%"/>
      <ellipse cx="-21" cy="21" rx="6" ry="16" transform="rotate(225 -21 21)" fill="%%PETAL%%"/>
      <ellipse cx="-30" cy="0" rx="6" ry="16" transform="rotate(270 -30 0)" fill="%%PETAL%%"/>
      <ellipse cx="-21" cy="-21" rx="6" ry="16" transform="rotate(315 -21 -21)" fill="%%PETAL%%"/>
      <!-- Inner Layer -->
      <circle cx="0" cy="0" r="16" fill="%%GOLD%%"/>
      <circle cx="0" cy="0" r="8" fill="#e65100"/>
    </g>`
  },
  {
    id: 'Flower4', num: 4, type: 'flower', name: 'BAMBOO', char: '竹', color: '#b93c3c', darkColor: '#ff5252',
    svgContent: `
    <!-- Bamboo Stalks & Leaves -->
    <path d="M-25,45 L-25,-45" stroke="#2e7d32" stroke-width="10" stroke-linecap="round"/>
    <line x1="-31" y1="-15" x2="-19" y2="-15" stroke="#1b5e20" stroke-width="3"/>
    <line x1="-31" y1="15" x2="-19" y2="15" stroke="#1b5e20" stroke-width="3"/>
    <path d="M20,45 L20,-35" stroke="#2e7d32" stroke-width="8" stroke-linecap="round"/>
    <line x1="15" y1="5" x2="25" y2="5" stroke="#1b5e20" stroke-width="3"/>
    <!-- Leaves -->
    <path d="M-25,-15 Q-55,-30 -60,-50 Q-40,-35 -25,-15" fill="%%PETAL%%"/>
    <path d="M-25,-15 Q-50,-10 -65,-5 Q-40,-5 -25,-15" fill="%%PETAL%%"/>
    <path d="M20,5 Q55,-10 70,-25 Q45,-5 20,5" fill="%%PETAL%%"/>
    <path d="M20,5 Q50,20 65,30 Q45,15 20,5" fill="%%PETAL%%"/>
    <path d="M-25,15 Q0,-5 15,-20 Q0,5 -25,15" fill="%%PETAL%%"/>`
  },
  {
    id: 'Season1', num: 1, type: 'season', name: 'SPRING', char: '春', color: '#1b7340', darkColor: '#66bb6a',
    svgContent: `
    <!-- Spring Sun & Green Sprout -->
    <circle cx="0" cy="-25" r="22" fill="%%GOLD%%"/>
    <path d="M-40,-25 L-25,-25" stroke="%%GOLD%%" stroke-width="4" stroke-linecap="round"/>
    <path d="M25,-25 L40,-25" stroke="%%GOLD%%" stroke-width="4" stroke-linecap="round"/>
    <path d="M0,-65 L0,-50" stroke="%%GOLD%%" stroke-width="4" stroke-linecap="round"/>
    <path d="M-28,-53 L-18,-43" stroke="%%GOLD%%" stroke-width="4" stroke-linecap="round"/>
    <path d="M28,-53 L18,-43" stroke="%%GOLD%%" stroke-width="4" stroke-linecap="round"/>
    <!-- Fresh Sprout -->
    <path d="M0,45 Q0,10 0,0" stroke="#2e7d32" stroke-width="7" stroke-linecap="round"/>
    <path d="M0,10 Q-35,0 -40,-25 Q-15,-15 0,10" fill="%%SEASON_GREEN%%"/>
    <path d="M0,5 Q35,-5 40,-30 Q15,-20 0,5" fill="%%SEASON_GREEN%%"/>`
  },
  {
    id: 'Season2', num: 2, type: 'season', name: 'SUMMER', char: '夏', color: '#1b7340', darkColor: '#66bb6a',
    svgContent: `
    <!-- Summer Radiant Lotus & Warm Sun -->
    <circle cx="0" cy="-28" r="18" fill="%%GOLD%%"/>
    <path d="M-50,30 Q0,-5 50,30 Q0,45 -50,30" fill="#1565c0" opacity="0.3"/>
    <!-- Lotus Petals -->
    <path d="M0,15 C-25,-15 -10,-45 0,-40 C10,-45 25,-15 0,15" fill="#e91e63"/>
    <path d="M0,15 C-45,0 -50,20 -35,25 C-25,25 -10,18 0,15" fill="#f06292"/>
    <path d="M0,15 C45,0 50,20 35,25 C25,25 10,18 0,15" fill="#f06292"/>
    <circle cx="0" cy="10" r="5" fill="%%GOLD%%"/>`
  },
  {
    id: 'Season3', num: 3, type: 'season', name: 'AUTUMN', char: '秋', color: '#1b7340', darkColor: '#66bb6a',
    svgContent: `
    <!-- Autumn Golden & Red Maple Leaf -->
    <path d="M0,45 Q-5,25 0,10" stroke="#5d4037" stroke-width="5" stroke-linecap="round"/>
    <g transform="translate(0, -10)">
      <path d="M0,20 L-10,-5 L-45,0 L-25,-25 L-55,-40 L-25,-45 L0,-65 L25,-45 L55,-40 L25,-25 L45,0 L10,-5 Z" fill="#e65100"/>
      <path d="M0,15 L-8,-5 L-35,0 L-20,-20 L-42,-32 L-20,-36 L0,-52 L20,-36 L42,-32 L20,-20 L35,0 L8,-5 Z" fill="%%GOLD%%"/>
    </g>`
  },
  {
    id: 'Season4', num: 4, type: 'season', name: 'WINTER', char: '冬', color: '#142896', darkColor: '#64b5f6',
    svgContent: `
    <!-- Winter Crystal Snowflake & Evergreen -->
    <g transform="translate(0, -10)">
      <!-- 6-point Snowflake -->
      <line x1="0" y1="-45" x2="0" y2="45" stroke="%%SNOW%%" stroke-width="5" stroke-linecap="round"/>
      <line x1="-39" y1="-22.5" x2="39" y2="22.5" stroke="%%SNOW%%" stroke-width="5" stroke-linecap="round"/>
      <line x1="-39" y1="22.5" x2="39" y2="-22.5" stroke="%%SNOW%%" stroke-width="5" stroke-linecap="round"/>
      <!-- V branchlets -->
      <path d="M-12,-30 L0,-20 L12,-30" fill="none" stroke="%%SNOW%%" stroke-width="4" stroke-linecap="round"/>
      <path d="M-12,30 L0,20 L12,30" fill="none" stroke="%%SNOW%%" stroke-width="4" stroke-linecap="round"/>
      <path d="M-30,-5 L-20,-12 L-25,-25" fill="none" stroke="%%SNOW%%" stroke-width="4" stroke-linecap="round"/>
      <path d="M30,5 L20,12 L25,25" fill="none" stroke="%%SNOW%%" stroke-width="4" stroke-linecap="round"/>
      <path d="M-30,5 L-20,12 L-25,25" fill="none" stroke="%%SNOW%%" stroke-width="4" stroke-linecap="round"/>
      <path d="M30,-5 L20,-12 L25,-25" fill="none" stroke="%%SNOW%%" stroke-width="4" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="8" fill="#e1f5fe"/>
      <circle cx="0" cy="0" r="4" fill="%%SNOW%%"/>
    </g>`
  }
];

function buildSVG(item, isDark) {
  const mainColor = isDark ? item.darkColor : item.color;
  const numBg = isDark ? '#2a2a2a' : mainColor;
  const numColor = isDark ? item.darkColor : '#ffffff';
  const numBorder = isDark ? `stroke="${item.darkColor}" stroke-width="2"` : '';
  const charColor = isDark ? '#ffffff' : mainColor;
  
  let content = item.svgContent
    .replace(/%%PETAL%%/g, isDark ? '#ff7043' : '#d32f2f')
    .replace(/%%CENTER_BG%%/g, isDark ? '#ffebee' : '#ffcdd2')
    .replace(/%%GOLD%%/g, isDark ? '#ffd54f' : '#fbc02d')
    .replace(/%%SEASON_GREEN%%/g, isDark ? '#81c784' : '#43a047')
    .replace(/%%SNOW%%/g, isDark ? '#81d4fa' : '#0288d1');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
  <!-- Top Left Number Badge -->
  <g transform="translate(22, 22)">
    <rect x="0" y="0" width="38" height="48" rx="6" fill="${numBg}" ${numBorder} />
    <text x="19" y="34" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="28" fill="${numColor}" text-anchor="middle">${item.num}</text>
  </g>
  <!-- Top Right Romanized Tag -->
  <text x="274" y="54" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="bold" font-size="20" fill="${mainColor}" text-anchor="end" letter-spacing="1">${item.name}</text>
  
  <!-- Artwork -->
  <g transform="translate(150, 160)">
    ${content}
  </g>

  <!-- Traditional Hanzi Character -->
  <text x="150" y="350" font-family="'Noto Serif SC', 'SimSun', 'Songti SC', 'STKaiti', 'KaiTi', 'Microsoft YaHei', serif" font-weight="900" font-size="128" fill="${charColor}" text-anchor="middle">${item.char}</text>
</svg>`;
}

items.forEach(item => {
  const regPath = path.join(baseDir, 'regular', item.id + '.svg');
  const darkPath = path.join(baseDir, 'black', item.id + '.svg');
  fs.writeFileSync(regPath, buildSVG(item, false));
  fs.writeFileSync(darkPath, buildSVG(item, true));
  console.log('Wrote:', item.id, 'regular + black');
});
