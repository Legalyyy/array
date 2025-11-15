// Font configuration with previews and categorization
export const FONT_CONFIG = [
  // Epic Fonts
  {
    name: "Cinzel Decorative",
    value: "'Cinzel Decorative', cursive",
    category: "epic",
    preview: "Epic Warrior",
    import: "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&display=swap"
  },
  {
    name: "Black Ops One",
    value: "'Black Ops One', cursive",
    category: "epic",
    preview: "Tactical Strike",
    import: "https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap"
  },
  {
    name: "Righteous",
    value: "'Righteous', cursive",
    category: "epic",
    preview: "Legendary Hero",
    import: "https://fonts.googleapis.com/css2?family=Righteous&display=swap"
  },
  {
    name: "Orbitron",
    value: "'Orbitron', sans-serif",
    category: "epic",
    preview: "Cyber Warrior",
    import: "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap"
  },
  {
    name: "Bungee",
    value: "'Bungee', cursive",
    category: "epic",
    preview: "Street King",
    import: "https://fonts.googleapis.com/css2?family=Bungee&display=swap"
  },
  
  // Elegant Fonts
  {
    name: "Playfair Display",
    value: "'Playfair Display', serif",
    category: "elegant",
    preview: "Sophisticated",
    import: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap"
  },
  {
    name: "Cormorant Garamond",
    value: "'Cormorant Garamond', serif",
    category: "elegant",
    preview: "Distinguished",
    import: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&display=swap"
  },
  {
    name: "Bodoni Moda",
    value: "'Bodoni Moda', serif",
    category: "elegant",
    preview: "Classy Elite",
    import: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;600;700&display=swap"
  },
  {
    name: "Crimson Pro",
    value: "'Crimson Pro', serif",
    category: "elegant",
    preview: "Refined Taste",
    import: "https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600&display=swap"
  },
  
  // Signature/Script Fonts
  {
    name: "Great Vibes",
    value: "'Great Vibes', cursive",
    category: "signature",
    preview: "Signature Style",
    import: "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"
  },
  {
    name: "Allura",
    value: "'Allura', cursive",
    category: "signature",
    preview: "Elegant Script",
    import: "https://fonts.googleapis.com/css2?family=Allura&display=swap"
  },
  {
    name: "Alex Brush",
    value: "'Alex Brush', cursive",
    category: "signature",
    preview: "Brush Signature",
    import: "https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap"
  },
  {
    name: "Dancing Script",
    value: "'Dancing Script', cursive",
    category: "signature",
    preview: "Flowing Script",
    import: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&display=swap"
  },
  
  // Tuff/Bold Fonts
  {
    name: "Bebas Neue",
    value: "'Bebas Neue', cursive",
    category: "tuff",
    preview: "STREET BOSS",
    import: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
  },
  {
    name: "Russo One",
    value: "'Russo One', sans-serif",
    category: "tuff",
    preview: "POWER MOVE",
    import: "https://fonts.googleapis.com/css2?family=Russo+One&display=swap"
  },
  {
    name: "Anton",
    value: "'Anton', sans-serif",
    category: "tuff",
    preview: "ALPHA MODE",
    import: "https://fonts.googleapis.com/css2?family=Anton&display=swap"
  },
  {
    name: "Teko",
    value: "'Teko', sans-serif",
    category: "tuff",
    preview: "UNSTOPPABLE",
    import: "https://fonts.googleapis.com/css2?family=Teko:wght@400;600;700&display=swap"
  },
  {
    name: "Saira Condensed",
    value: "'Saira Condensed', sans-serif",
    category: "tuff",
    preview: "GRINDER",
    import: "https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;600;900&display=swap"
  },
  
  // Modern/Clean Fonts
  {
    name: "Montserrat",
    value: "'Montserrat', sans-serif",
    category: "modern",
    preview: "Clean Modern",
    import: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap"
  },
  {
    name: "Poppins",
    value: "'Poppins', sans-serif",
    category: "modern",
    preview: "Modern Style",
    import: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap"
  },
  {
    name: "Inter",
    value: "'Inter', sans-serif",
    category: "modern",
    preview: "Professional",
    import: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap"
  },
  {
    name: "Raleway",
    value: "'Raleway', sans-serif",
    category: "modern",
    preview: "Sleek Design",
    import: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700&display=swap"
  },
];

// Name animations configuration
export const NAME_ANIMATIONS = [
  { value: "", label: "None" },
  { value: "pulse", label: "Pulse" },
  { value: "glow-pulse", label: "Glowing Pulse" },
  { value: "wave", label: "Wave" },
  { value: "float", label: "Float" },
  { value: "shimmer", label: "Shimmer" },
  { value: "rainbow", label: "Rainbow" },
  { value: "neon-flicker", label: "Neon Flicker" },
  { value: "slide-in", label: "Slide In" },
  { value: "bounce", label: "Bounce" },
  { value: "glitch", label: "Glitch" },
];

// Gallery display modes
export const GALLERY_MODES = [
  { value: "grid", label: "Grid" },
  { value: "masonry", label: "Masonry" },
  { value: "list", label: "List" },
  { value: "cards-3", label: "Cards (3 columns)" },
  { value: "cards-4", label: "Cards (4 columns)" },
  { value: "compact", label: "Compact" },
  { value: "showcase", label: "Showcase" },
];

// Profile intro effects
export const INTRO_EFFECTS = [
  { value: "", label: "None" },
  { value: "fade-zoom", label: "Fade & Zoom" },
  { value: "slide-up", label: "Slide Up" },
  { value: "curtain", label: "Curtain Reveal" },
  { value: "spiral", label: "Spiral In" },
  { value: "glitch-reveal", label: "Glitch Reveal" },
  { value: "particle-burst", label: "Particle Burst" },
  { value: "matrix-rain", label: "Matrix Rain" },
  { value: "neon-glow", label: "Neon Glow In" },
  { value: "shatter", label: "Shatter Entry" },
  { value: "portal", label: "Portal Effect" },
];

// Profile background effects
export const PROFILE_EFFECTS = [
  { value: "", label: "None" },
  { value: "falling-leaves", label: "Falling Leaves 🍂" },
  { value: "shooting-stars", label: "Shooting Stars ⭐" },
  { value: "snow", label: "Snow ❄️" },
  { value: "particles", label: "Colorful Particles ✨" },
  { value: "fireflies", label: "Fireflies 🔆" },
  { value: "bubbles", label: "Bubbles 🫧" },
  { value: "rain", label: "Rain 🌧️" },
  { value: "matrix", label: "Matrix Code 💻" },
  { value: "aurora", label: "Aurora Borealis 🌌" },
  { value: "geometric", label: "Geometric Shapes 🔷" },
  { value: "glowing-orbs", label: "Glowing Orbs ⚡" },
  { value: "lightning", label: "Lightning ⚡" },
  { value: "confetti", label: "Confetti 🎉" },
  { value: "smoke", label: "Smoke 💨" },
];

// Load all fonts
export function loadAllFonts() {
  const head = document.head;
  const existingLinks = new Set(
    Array.from(head.querySelectorAll('link[rel="stylesheet"]')).map(link => link.href)
  );
  
  FONT_CONFIG.forEach(font => {
    if (!existingLinks.has(font.import)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = font.import;
      head.appendChild(link);
    }
  });
}
