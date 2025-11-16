// Advanced Profile Customization System
// Handles all customization features with smooth animations

export class ProfileCustomization {
  constructor() {
    this.currentProfile = null;
    this.customizationData = {};
    this.effectsActive = false;
    this.currentEffect = null;
  }

  // Initialize with profile data
  init(profileData, customization) {
    this.currentProfile = profileData;
    this.customizationData = customization || {};
    this.applyCustomization(this.customizationData);
    
    if (this.customizationData.profileEffect) {
      this.startEffect(this.customizationData.profileEffect);
    }
  }

  // Apply customization with smooth transitions
  applyCustomization(customization, animated = false) {
    const profileBackground = document.getElementById('profileBackground');
    const profileOverlay = document.getElementById('profileOverlay');
    const profileUsername = document.getElementById('profileUsername');
    const profileAvatar = document.getElementById('profileAvatar');
    
    // Add transition class if animated
    if (animated) {
      profileBackground.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      profileOverlay.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      profileUsername.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      profileAvatar.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    // Background image
    if (customization.backgroundImage) {
      profileBackground.style.backgroundImage = `url(${customization.backgroundImage})`;
      profileBackground.style.backgroundSize = 'cover';
      profileBackground.style.backgroundPosition = 'center';
    } else {
      profileBackground.style.backgroundImage = 'none';
    }
    
    // Background color
    if (customization.backgroundColor) {
      profileBackground.style.backgroundColor = customization.backgroundColor;
    } else {
      profileBackground.style.backgroundColor = '#000000';
    }
    
    // Overlay color and opacity
    const overlayColor = customization.overlayColor || '#000000';
    const overlayOpacity = customization.overlayOpacity !== undefined ? customization.overlayOpacity / 100 : 0.5;
    
    let rgbColor;
    if (overlayColor.startsWith('#')) {
      const r = parseInt(overlayColor.slice(1, 3), 16);
      const g = parseInt(overlayColor.slice(3, 5), 16);
      const b = parseInt(overlayColor.slice(5, 7), 16);
      rgbColor = `rgba(${r}, ${g}, ${b}, ${overlayOpacity})`;
    } else {
      rgbColor = overlayColor;
    }
    
    profileOverlay.style.backgroundColor = rgbColor;
    
    // Name font
    if (customization.nameFont) {
      profileUsername.style.fontFamily = customization.nameFont;
    } else {
      profileUsername.style.fontFamily = "'Inter', sans-serif";
    }
    
    // Name color
    if (customization.nameColor) {
      profileUsername.style.color = customization.nameColor;
    } else {
      profileUsername.style.color = '#ffffff';
    }
    
    // Avatar glow color
    const avatarGlowColor = customization.avatarGlowColor || '#8b5cf6';
    profileAvatar.style.boxShadow = `0 0 30px ${avatarGlowColor}, 0 0 60px ${avatarGlowColor}40, 0 0 90px ${avatarGlowColor}20`;
    
    // Remove transitions after animation
    if (animated) {
      setTimeout(() => {
        profileBackground.style.transition = '';
        profileOverlay.style.transition = '';
        profileUsername.style.transition = '';
        profileAvatar.style.transition = '';
      }, 600);
    }
  }

  // Start visual effect
  startEffect(effectType) {
    this.stopEffect();
    this.currentEffect = effectType;
    this.effectsActive = true;

    const effectsContainer = document.getElementById('profileEffects');
    if (!effectsContainer) return;

    effectsContainer.innerHTML = '';

    switch (effectType) {
      case 'falling-leaves':
        this.createFallingLeaves(effectsContainer);
        break;
      case 'shooting-stars':
        this.createShootingStars(effectsContainer);
        break;
      case 'snow':
        this.createSnow(effectsContainer);
        break;
      case 'particles':
        this.createParticles(effectsContainer);
        break;
      case 'fireflies':
        this.createFireflies(effectsContainer);
        break;
      case 'bubbles':
        this.createBubbles(effectsContainer);
        break;
      default:
        this.effectsActive = false;
    }
  }

  // Stop current effect
  stopEffect() {
    this.effectsActive = false;
    const effectsContainer = document.getElementById('profileEffects');
    if (effectsContainer) {
      effectsContainer.innerHTML = '';
    }
  }

  // Create falling leaves effect
  createFallingLeaves(container) {
    const createLeaf = () => {
      if (!this.effectsActive || this.currentEffect !== 'falling-leaves') return;
      
      const leaf = document.createElement('div');
      leaf.className = 'effect-leaf';
      leaf.textContent = ['🍂', '🍁', '🌿'][Math.floor(Math.random() * 3)];
      leaf.style.left = Math.random() * 100 + '%';
      leaf.style.fontSize = (Math.random() * 15 + 15) + 'px';
      leaf.style.animationDuration = (Math.random() * 5 + 5) + 's';
      leaf.style.opacity = Math.random() * 0.7 + 0.3;
      
      container.appendChild(leaf);
      
      setTimeout(() => {
        leaf.remove();
      }, 10000);
    };

    setInterval(() => {
      if (this.effectsActive && this.currentEffect === 'falling-leaves') {
        createLeaf();
      }
    }, 300);
  }

  // Create shooting stars effect
  createShootingStars(container) {
    const createStar = () => {
      if (!this.effectsActive || this.currentEffect !== 'shooting-stars') return;
      
      const star = document.createElement('div');
      star.className = 'effect-shooting-star';
      star.style.top = Math.random() * 50 + '%';
      star.style.left = Math.random() * 50 + '%';
      
      container.appendChild(star);
      
      setTimeout(() => {
        star.remove();
      }, 3000);
    };

    setInterval(() => {
      if (this.effectsActive && this.currentEffect === 'shooting-stars') {
        createStar();
      }
    }, 2000);
  }

  // Create snow effect
  createSnow(container) {
    const createSnowflake = () => {
      if (!this.effectsActive || this.currentEffect !== 'snow') return;
      
      const snowflake = document.createElement('div');
      snowflake.className = 'effect-snowflake';
      snowflake.textContent = '❄';
      snowflake.style.left = Math.random() * 100 + '%';
      snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
      snowflake.style.animationDuration = (Math.random() * 5 + 5) + 's';
      snowflake.style.opacity = Math.random() * 0.8 + 0.2;
      
      container.appendChild(snowflake);
      
      setTimeout(() => {
        snowflake.remove();
      }, 10000);
    };

    setInterval(() => {
      if (this.effectsActive && this.currentEffect === 'snow') {
        createSnowflake();
      }
    }, 200);
  }

  // Create particles effect
  createParticles(container) {
    const createParticle = () => {
      if (!this.effectsActive || this.currentEffect !== 'particles') return;
      
      const particle = document.createElement('div');
      particle.className = 'effect-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.width = (Math.random() * 4 + 2) + 'px';
      particle.style.height = particle.style.width;
      particle.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
      particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
      
      container.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 5000);
    };

    setInterval(() => {
      if (this.effectsActive && this.currentEffect === 'particles') {
        createParticle();
      }
    }, 100);
  }

  // Create fireflies effect
  createFireflies(container) {
    const createFirefly = () => {
      if (!this.effectsActive || this.currentEffect !== 'fireflies') return;
      
      const firefly = document.createElement('div');
      firefly.className = 'effect-firefly';
      firefly.style.left = Math.random() * 100 + '%';
      firefly.style.top = Math.random() * 100 + '%';
      firefly.style.animationDuration = (Math.random() * 3 + 2) + 's';
      
      container.appendChild(firefly);
      
      setTimeout(() => {
        firefly.remove();
      }, 6000);
    };

    for (let i = 0; i < 15; i++) {
      setTimeout(() => createFirefly(), i * 200);
    }

    setInterval(() => {
      if (this.effectsActive && this.currentEffect === 'fireflies') {
        createFirefly();
      }
    }, 400);
  }

  // Create bubbles effect
  createBubbles(container) {
    const createBubble = () => {
      if (!this.effectsActive || this.currentEffect !== 'bubbles') return;
      
      const bubble = document.createElement('div');
      bubble.className = 'effect-bubble';
      bubble.style.left = Math.random() * 100 + '%';
      bubble.style.width = (Math.random() * 40 + 20) + 'px';
      bubble.style.height = bubble.style.width;
      bubble.style.animationDuration = (Math.random() * 4 + 4) + 's';
      
      container.appendChild(bubble);
      
      setTimeout(() => {
        bubble.remove();
      }, 8000);
    };

    setInterval(() => {
      if (this.effectsActive && this.currentEffect === 'bubbles') {
        createBubble();
      }
    }, 500);
  }
}
