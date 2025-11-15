import { FONT_CONFIG, loadAllFonts } from './fonts-config.js';

// Profile customization state
let currentProfile = null;
let customizationData = {};
let currentFont = null;

// Load all fonts when module initializes
loadAllFonts();

// Format P&L with proper +/- and $ symbol
function formatPnL(pnlValue) {
  // Remove any existing formatting
  const numericValue = parseFloat(pnlValue.toString().replace(/[^0-9.-]/g, ''));
  
  if (isNaN(numericValue)) {
    return pnlValue;
  }
  
  // Format with + or - sign and $ symbol
  const sign = numericValue >= 0 ? '+' : '-';
  const absValue = Math.abs(numericValue);
  return `${sign}$${absValue.toFixed(2)}`;
}

// Load user profile with premium features
export async function loadProfile(username) {
  try {
    const response = await fetch(`/api/profile/${username}`);
    const data = await response.json();
    
    if (!data.success) {
      alert(data.error || 'User not found');
      window.location.href = '/';
      return;
    }
    
    currentProfile = data.user;
    customizationData = data.user.customization || {};
    
    // Display profile info
    const profileUsername = document.getElementById('profileUsername');
    const totalTrades = document.getElementById('totalTrades');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileGallery = document.getElementById('profileGallery');
    const premiumBadge = document.getElementById('premiumBadge');
    const customizeBtn = document.getElementById('customizeBtn');
    const lockIcon = document.getElementById('lockIcon');
    const customizeBtnText = document.getElementById('customizeBtnText');
    const visibilityBtn = document.getElementById('visibilityBtn');
    
    profileUsername.textContent = data.user.username;
    totalTrades.textContent = data.user.totalTrades;
    
    // Set avatar
    if (data.user.avatarUrl) {
      profileAvatar.src = data.user.avatarUrl;
    } else {
      profileAvatar.src = `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`;
    }
    
    // Show premium badge if user is premium
    if (data.user.isPremium) {
      premiumBadge.classList.remove('hidden');
    }
    
    // Setup customize button
    if (data.user.isOwnProfile) {
      customizeBtn.style.display = 'flex';
      visibilityBtn.classList.remove('hidden');
      
      if (data.user.isPremium) {
        // Premium user - enable customization
        customizeBtn.classList.remove('locked');
        lockIcon.classList.add('hidden');
        customizeBtn.onclick = () => openCustomizationModal();
      } else {
        // Non-premium user - show locked state
        customizeBtn.classList.add('locked');
        lockIcon.classList.remove('hidden');
        customizeBtnText.textContent = 'Locked';
        customizeBtn.onclick = () => {
          showPremiumWarning();
        };
      }
    } else {
      // Not own profile - hide buttons
      customizeBtn.style.display = 'none';
      visibilityBtn.classList.add('hidden');
    }
    
    // Apply customization regardless of profile visibility
    applyCustomization(customizationData);
    
    // Apply intro effect if exists
    if (customizationData.profileIntro) {
      applyIntroEffect(customizationData.profileIntro);
    }
    
    // Check if profile is private and not own profile
    const isPrivate = customizationData.isProfilePublic === false;
    if (isPrivate && !data.user.isOwnProfile) {
      // Private profile - show message but keep customizations
      profileGallery.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6); font-size: 16px;">This profile is private</div>';
    } else {
      // Clear and render gallery
      profileGallery.innerHTML = '';
      const isOwnProfile = data.user.isOwnProfile;
      const galleryDisplay = customizationData.galleryDisplay || 'grid';
      const showPnl = customizationData.showPnl !== false;
      const showNotes = customizationData.showNotes !== false;
      
      // Apply gallery display mode
      profileGallery.className = 'profile-gallery-modern';
      if (galleryDisplay && galleryDisplay !== 'grid') {
        profileGallery.classList.add(galleryDisplay);
      }
      
      // Check if user has no trades
      if (data.user.trades.length === 0) {
        profileGallery.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6); font-size: 16px;">No trades registered.</div>';
      } else {
        // Render trades
        data.user.trades.forEach(trade => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        // Image
        const img = document.createElement('img');
        if (trade.imageUrl) {
          img.src = trade.imageUrl;
          img.alt = `Trade ${trade.id}`;
        } else {
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23000000"/%3E%3C/svg%3E';
          img.alt = 'No screenshot';
        }
        
        // Add click handler to zoom image
        item.onclick = () => {
          openImageZoom(trade, showPnl, showNotes);
        };
        
        item.appendChild(img);
        
        // Overlay with trade info
        const overlay = document.createElement('div');
        overlay.className = 'gallery-item-overlay';
        
        if (showPnl) {
          const pnl = document.createElement('div');
          const formattedPnl = formatPnL(trade.pnl);
          pnl.className = `trade-pnl ${formattedPnl.startsWith('+') ? 'positive' : 'negative'}`;
          pnl.textContent = formattedPnl;
          overlay.appendChild(pnl);
        }
        
        if (showNotes) {
          const notes = document.createElement('div');
          notes.className = 'trade-notes';
          notes.textContent = trade.notes;
          overlay.appendChild(notes);
        }
        
        item.appendChild(overlay);
        
        // Delete button (only if viewing own profile)
        if (isOwnProfile) {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-trade-btn';
          deleteBtn.innerHTML = '×';
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTrade(trade.id);
          };
          item.appendChild(deleteBtn);
        }
        
        profileGallery.appendChild(item);
        });
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    alert('Error loading profile');
    window.location.href = '/';
  }
}

// Apply intro effect
function applyIntroEffect(effect) {
  if (!effect) return;
  
  const profilePage = document.getElementById('profile-page');
  const profileIntro = document.getElementById('profileIntro');
  
  // Add intro effect class
  profilePage.classList.add(`intro-${effect}`);
  
  // Remove effect after animation completes
  setTimeout(() => {
    profilePage.classList.remove(`intro-${effect}`);
    profileIntro.remove();
  }, 3000);
}

// Apply customization to profile
function applyCustomization(customization) {
  const profileBackground = document.getElementById('profileBackground');
  const profileOverlay = document.getElementById('profileOverlay');
  const profileUsername = document.getElementById('profileUsername');
  const profileAvatar = document.getElementById('profileAvatar');
  const profileEffects = document.getElementById('profileEffects');
  
  // Background - check type
  if (customization.backgroundGradient) {
    // Gradient background
    const gradient = customization.backgroundGradient;
    if (gradient.startsWith('radial')) {
      profileBackground.style.backgroundImage = gradient;
    } else {
      profileBackground.style.backgroundImage = gradient;
    }
    profileBackground.style.backgroundColor = 'transparent';
  } else if (customization.backgroundImage) {
    // Image background
    profileBackground.style.backgroundImage = `url(${customization.backgroundImage})`;
    profileBackground.style.backgroundColor = customization.backgroundColor || '#000000';
  } else {
    // Solid color background
    profileBackground.style.backgroundImage = 'none';
    profileBackground.style.backgroundColor = customization.backgroundColor || '#000000';
  }
  
  // Background blur
  const blur = customization.backgroundBlur !== undefined ? customization.backgroundBlur : 20;
  document.documentElement.style.setProperty('--profile-blur', `${blur}px`);
  
  // Overlay color and opacity
  const overlayColor = customization.overlayColor || '#000000';
  const overlayOpacity = customization.overlayOpacity !== undefined ? customization.overlayOpacity / 100 : 0.5;
  
  // Parse color and apply opacity
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
  profileOverlay.style.backdropFilter = `blur(${blur}px)`;
  profileOverlay.style.webkitBackdropFilter = `blur(${blur}px)`;
  
  // Name font
  if (customization.nameFont) {
    profileUsername.style.fontFamily = customization.nameFont;
  } else {
    profileUsername.style.fontFamily = "'Inter', sans-serif";
  }
  
  // Name font size
  if (customization.nameFontSize) {
    profileUsername.style.fontSize = customization.nameFontSize;
  }
  
  // Name styling
  if (customization.nameGradient) {
    // Gradient name
    profileUsername.style.background = customization.nameGradient;
    profileUsername.style.webkitBackgroundClip = 'text';
    profileUsername.style.backgroundClip = 'text';
    profileUsername.style.webkitTextFillColor = 'transparent';
    profileUsername.style.color = 'transparent';
  } else if (customization.nameGlowColor) {
    // Glowing name
    profileUsername.style.color = customization.nameColor || '#ffffff';
    profileUsername.style.background = 'none';
    profileUsername.style.webkitTextFillColor = 'unset';
    profileUsername.style.textShadow = `
      0 0 10px ${customization.nameGlowColor},
      0 0 20px ${customization.nameGlowColor},
      0 0 30px ${customization.nameGlowColor}
    `;
  } else {
    // Solid color name
    profileUsername.style.color = customization.nameColor || '#ffffff';
    profileUsername.style.background = 'none';
    profileUsername.style.webkitTextFillColor = 'unset';
    profileUsername.style.textShadow = 'none';
  }
  
  // Name animation
  if (customization.nameAnimation) {
    // Remove previous animation classes
    profileUsername.className = profileUsername.className.replace(/name-\w+/g, '');
    profileUsername.classList.add(`name-${customization.nameAnimation}`);
    
    // For wave animation, split text into spans
    if (customization.nameAnimation === 'wave') {
      const text = profileUsername.textContent;
      profileUsername.innerHTML = '';
      text.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        profileUsername.appendChild(span);
      });
    }
  } else {
    // Remove animation classes
    profileUsername.className = profileUsername.className.replace(/name-\w+/g, '');
  }
  
  // Avatar glow and border
  const avatarWrapper = profileAvatar.closest('.avatar-wrapper');
  if (avatarWrapper) {
    // Apply border color
    if (customization.avatarBorderColor) {
      profileAvatar.style.border = `4px solid ${customization.avatarBorderColor}`;
    }
    
    // Apply glow
    if (customization.avatarGlowEnabled !== false && customization.avatarGlowColor) {
      const intensity = customization.avatarGlowIntensity || 30;
      const i1 = intensity / 3;
      const i2 = intensity * 2 / 3;
      const i3 = intensity;
      avatarWrapper.style.boxShadow = `
        0 0 ${i1}px ${customization.avatarGlowColor},
        0 0 ${i2}px ${customization.avatarGlowColor},
        0 0 ${i3}px ${customization.avatarGlowColor}
      `;
    } else {
      avatarWrapper.style.boxShadow = 'none';
    }
  }
  
  // Profile effects
  if (customization.profileEffect) {
    createProfileEffect(customization.profileEffect, profileEffects);
  } else {
    profileEffects.innerHTML = '';
  }
}

// Create profile background effect
function createProfileEffect(effect, container) {
  container.innerHTML = '';
  
  // Geometric shapes removed per user request
  if (effect === 'geometric') {
    return;
  }
  
  const effectCount = {
    'rain': 50,
    'matrix': 30,
    'aurora': 3,
    'glowing-orbs': 10,
    'lightning': 5,
    'confetti': 60,
    'smoke': 8,
    'falling-leaves': 30,
    'shooting-stars': 15,
    'snow': 50,
    'particles': 40,
    'fireflies': 25,
    'bubbles': 30
  };
  
  const count = effectCount[effect] || 20;
  
  // Map effect names to their CSS class names
  const effectClassMap = {
    'falling-leaves': 'effect-leaf',
    'shooting-stars': 'effect-shooting-star',
    'particles': 'effect-particle',
    'glowing-orbs': 'effect-orb',
    'snow': 'effect-snowflake',
    'fireflies': 'effect-firefly',
    'bubbles': 'effect-bubble'
  };
  
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    
    // Use mapped class name or default to effect-{name}
    el.className = effectClassMap[effect] || `effect-${effect}`;
    
    // Random positioning
    el.style.left = `${Math.random() * 100}%`;
    el.style.top = `${Math.random() * 100}%`;
    el.style.animationDelay = `${Math.random() * 3}s`;
    el.style.animationDuration = `${3 + Math.random() * 5}s`;
    
    // Special styling for specific effects
    if (effect === 'confetti') {
      el.style.setProperty('--confetti-hue', Math.random() * 360);
    } else if (effect === 'matrix') {
      el.textContent = String.fromCharCode(33 + Math.floor(Math.random() * 94));
    } else if (effect === 'falling-leaves') {
      const leaves = ['🍂', '🍁', '🍃'];
      el.textContent = leaves[Math.floor(Math.random() * leaves.length)];
    } else if (effect === 'particles') {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#ff9ff3'];
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.width = `${4 + Math.random() * 6}px`;
      el.style.height = el.style.width;
    } else if (effect === 'glowing-orbs') {
      const colors = ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(236, 72, 153, 0.8)'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      el.style.background = `radial-gradient(circle, ${color}, transparent 70%)`;
      el.style.width = `${40 + Math.random() * 40}px`;
      el.style.height = el.style.width;
    } else if (effect === 'snow') {
      el.textContent = '❄';
    } else if (effect === 'fireflies') {
      el.style.width = `${3 + Math.random() * 3}px`;
      el.style.height = el.style.width;
    } else if (effect === 'bubbles') {
      el.style.width = `${20 + Math.random() * 40}px`;
      el.style.height = el.style.width;
    }
    
    container.appendChild(el);
  }
}

// Open customization modal
function openCustomizationModal() {
  const modal = document.getElementById('customizationModal');
  modal.classList.remove('hidden');
  
  // Load current customization into form
  loadCustomizationForm();
  
  // Populate font previews
  populateFontPreviews('all');
}

// Load customization form with current values
function loadCustomizationForm() {
  // Background type
  const bgType = customizationData.backgroundGradient ? 'gradient' : 
                 customizationData.backgroundImage ? 'image' : 'solid';
  document.getElementById('bgTypeInput').value = bgType;
  updateBackgroundTypeVisibility(bgType);
  
  // Background values
  document.getElementById('bgColorInput').value = customizationData.backgroundColor || '#000000';
  document.getElementById('bgImageInput').value = customizationData.backgroundImage || '';
  
  // Gradient values
  if (customizationData.backgroundGradient) {
    const gradient = customizationData.backgroundGradient;
    // Parse gradient (simplified - assumes linear-gradient format)
    const match = gradient.match(/linear-gradient\((.*?),\s*(.*?),\s*(.*?)\)/);
    if (match) {
      document.getElementById('bgGradientDirection').value = match[1];
      document.getElementById('bgGradientStart').value = match[2].trim();
      document.getElementById('bgGradientEnd').value = match[3].trim();
    }
  }
  
  // Background blur
  document.getElementById('bgBlurInput').value = customizationData.backgroundBlur || 20;
  document.getElementById('blurValue').textContent = customizationData.backgroundBlur || 20;
  
  // Overlay
  document.getElementById('overlayColorInput').value = customizationData.overlayColor || '#000000';
  document.getElementById('overlayOpacityInput').value = customizationData.overlayOpacity || 50;
  document.getElementById('opacityValue').textContent = customizationData.overlayOpacity || 50;
  
  // Avatar
  document.getElementById('avatarGlowEnabled').checked = customizationData.avatarGlowEnabled !== false;
  document.getElementById('avatarGlowInput').value = customizationData.avatarGlowColor || '#8b5cf6';
  document.getElementById('avatarGlowIntensityInput').value = customizationData.avatarGlowIntensity || 30;
  document.getElementById('glowIntensityValue').textContent = customizationData.avatarGlowIntensity || 30;
  document.getElementById('avatarBorderColorInput').value = customizationData.avatarBorderColor || '#8b5cf6';
  updateAvatarGlowPreview();
  
  // Name style
  const nameStyle = customizationData.nameGradient ? 'gradient' : 
                   customizationData.nameGlowColor ? 'glow' : 'solid';
  document.getElementById('nameStyleInput').value = nameStyle;
  updateNameStyleVisibility(nameStyle);
  
  document.getElementById('nameColorInput').value = customizationData.nameColor || '#ffffff';
  document.getElementById('nameAnimationInput').value = customizationData.nameAnimation || '';
  
  // Name gradient
  if (customizationData.nameGradient) {
    const match = customizationData.nameGradient.match(/linear-gradient\(.*?,\s*(.*?),\s*(.*?)\)/);
    if (match) {
      document.getElementById('nameGradientStart').value = match[1].trim();
      document.getElementById('nameGradientEnd').value = match[2].trim();
    }
  }
  
  // Name glow
  if (customizationData.nameGlowColor) {
    document.getElementById('nameGlowColorInput').value = customizationData.nameGlowColor;
  }
  
  // Name font size
  const fontSizeInput = document.getElementById('nameFontSizeInput');
  const fontSizeValue = document.getElementById('fontSizeValue');
  const fontSize = customizationData.nameFontSize || '3.0rem';
  const fontSizeNum = parseFloat(fontSize);
  fontSizeInput.value = fontSizeNum;
  fontSizeValue.textContent = fontSizeNum.toFixed(1);
  
  // Effects
  document.getElementById('profileIntroInput').value = customizationData.profileIntro || '';
  document.getElementById('profileEffectInput').value = customizationData.profileEffect || '';
  
  // Gallery
  document.getElementById('galleryDisplayInput').value = customizationData.galleryDisplay || 'grid';
  
  // Display options
  document.getElementById('showPnlInput').checked = customizationData.showPnl !== false;
  document.getElementById('showNotesInput').checked = customizationData.showNotes !== false;
  
  // Update name preview
  updateNamePreview();
}

// Update background type visibility
function updateBackgroundTypeVisibility(type) {
  const bgColorGroup = document.getElementById('bgColorGroup');
  const bgGradientGroup = document.getElementById('bgGradientGroup');
  const bgImageGroup = document.getElementById('bgImageGroup');
  
  bgColorGroup.classList.toggle('hidden', type !== 'solid');
  bgGradientGroup.classList.toggle('hidden', type !== 'gradient');
  bgImageGroup.classList.toggle('hidden', type !== 'image');
}

// Update name style visibility
function updateNameStyleVisibility(style) {
  const nameColorGroup = document.getElementById('nameColorGroup');
  const nameGradientGroup = document.getElementById('nameGradientGroup');
  const nameGlowGroup = document.getElementById('nameGlowGroup');
  
  nameColorGroup.classList.toggle('hidden', style !== 'solid');
  nameGradientGroup.classList.toggle('hidden', style !== 'gradient');
  nameGlowGroup.classList.toggle('hidden', style !== 'glow');
}

// Populate font previews
function populateFontPreviews(category) {
  const container = document.getElementById('fontPreviewContainer');
  container.innerHTML = '';
  
  const fonts = category === 'all' ? 
    FONT_CONFIG : 
    FONT_CONFIG.filter(f => f.category === category);
  
  fonts.forEach(font => {
    const item = document.createElement('div');
    item.className = 'font-preview-item';
    if (customizationData.nameFont === font.value) {
      item.classList.add('selected');
      currentFont = font.value;
    }
    
    const name = document.createElement('div');
    name.className = 'font-name';
    name.textContent = font.name;
    
    const sample = document.createElement('div');
    sample.className = 'font-sample';
    sample.style.fontFamily = font.value;
    sample.textContent = font.preview;
    
    item.appendChild(name);
    item.appendChild(sample);
    
    item.onclick = () => {
      // Remove selected from all
      container.querySelectorAll('.font-preview-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      currentFont = font.value;
      updateNamePreview();
    };
    
    container.appendChild(item);
  });
}

// Update name preview
function updateNamePreview() {
  const preview = document.getElementById('namePreview');
  const nameStyle = document.getElementById('nameStyleInput').value;
  
  // Apply font
  if (currentFont) {
    preview.style.fontFamily = currentFont;
  }
  
  // Apply font size
  const fontSize = document.getElementById('nameFontSizeInput').value;
  preview.style.fontSize = `${fontSize}rem`;
  
  // Apply style
  if (nameStyle === 'gradient') {
    const start = document.getElementById('nameGradientStart').value;
    const end = document.getElementById('nameGradientEnd').value;
    preview.style.background = `linear-gradient(90deg, ${start}, ${end})`;
    preview.style.webkitBackgroundClip = 'text';
    preview.style.backgroundClip = 'text';
    preview.style.webkitTextFillColor = 'transparent';
    preview.style.textShadow = 'none';
  } else if (nameStyle === 'glow') {
    const glowColor = document.getElementById('nameGlowColorInput').value;
    const nameColor = document.getElementById('nameColorInput').value;
    preview.style.color = nameColor;
    preview.style.background = 'none';
    preview.style.webkitTextFillColor = 'unset';
    preview.style.textShadow = `
      0 0 10px ${glowColor},
      0 0 20px ${glowColor},
      0 0 30px ${glowColor}
    `;
  } else {
    const color = document.getElementById('nameColorInput').value;
    preview.style.color = color;
    preview.style.background = 'none';
    preview.style.webkitTextFillColor = 'unset';
    preview.style.textShadow = 'none';
  }
  
  // Apply animation
  const animation = document.getElementById('nameAnimationInput').value;
  preview.className = '';
  if (animation) {
    preview.classList.add(`name-${animation}`);
  }
}

// Update avatar glow preview
function updateAvatarGlowPreview() {
  const preview = document.getElementById('avatarGlowPreview');
  const enabled = document.getElementById('avatarGlowEnabled').checked;
  const color = document.getElementById('avatarGlowInput').value;
  const intensity = document.getElementById('avatarGlowIntensityInput').value;
  const borderColor = document.getElementById('avatarBorderColorInput').value;
  
  // Update border
  preview.style.border = `4px solid ${borderColor}`;
  
  if (enabled) {
    const i1 = intensity / 3;
    const i2 = intensity * 2 / 3;
    const i3 = intensity;
    preview.style.boxShadow = `
      0 0 ${i1}px ${color},
      0 0 ${i2}px ${color},
      0 0 ${i3}px ${color}
    `;
  } else {
    preview.style.boxShadow = 'none';
  }
}

// Close customization modal
function closeCustomizationModal() {
  const modal = document.getElementById('customizationModal');
  modal.classList.add('hidden');
}

// Save customization
async function saveCustomization() {
  const bgType = document.getElementById('bgTypeInput').value;
  const nameStyle = document.getElementById('nameStyleInput').value;
  
  const newCustomization = {
    backgroundImage: bgType === 'image' ? document.getElementById('bgImageInput').value : null,
    backgroundColor: bgType === 'solid' ? document.getElementById('bgColorInput').value : '#000000',
    backgroundGradient: null,
    backgroundBlur: parseInt(document.getElementById('bgBlurInput').value),
    overlayColor: document.getElementById('overlayColorInput').value,
    overlayOpacity: parseInt(document.getElementById('overlayOpacityInput').value),
    nameFont: currentFont || "'Inter', sans-serif",
    nameFontSize: `${document.getElementById('nameFontSizeInput').value}rem`,
    nameColor: nameStyle === 'solid' ? document.getElementById('nameColorInput').value : '#ffffff',
    nameGradient: null,
    nameGlowColor: null,
    nameAnimation: document.getElementById('nameAnimationInput').value,
    galleryDisplay: document.getElementById('galleryDisplayInput').value,
    avatarGlowColor: document.getElementById('avatarGlowInput').value,
    avatarGlowEnabled: document.getElementById('avatarGlowEnabled').checked,
    avatarGlowIntensity: parseInt(document.getElementById('avatarGlowIntensityInput').value),
    avatarBorderColor: document.getElementById('avatarBorderColorInput').value,
    profileEffect: document.getElementById('profileEffectInput').value,
    profileIntro: document.getElementById('profileIntroInput').value,
    showPnl: document.getElementById('showPnlInput').checked,
    showNotes: document.getElementById('showNotesInput').checked,
  };
  
  // Handle gradient background
  if (bgType === 'gradient') {
    const start = document.getElementById('bgGradientStart').value;
    const end = document.getElementById('bgGradientEnd').value;
    const direction = document.getElementById('bgGradientDirection').value;
    
    if (direction === 'radial') {
      newCustomization.backgroundGradient = `radial-gradient(circle, ${start}, ${end})`;
    } else {
      newCustomization.backgroundGradient = `linear-gradient(${direction}, ${start}, ${end})`;
    }
  }
  
  // Handle name gradient
  if (nameStyle === 'gradient') {
    const start = document.getElementById('nameGradientStart').value;
    const end = document.getElementById('nameGradientEnd').value;
    newCustomization.nameGradient = `linear-gradient(90deg, ${start}, ${end})`;
  }
  
  // Handle name glow
  if (nameStyle === 'glow') {
    newCustomization.nameGlowColor = document.getElementById('nameGlowColorInput').value;
    newCustomization.nameColor = document.getElementById('nameColorInput').value;
  }
  
  try {
    // Save to server
    const response = await fetch('/api/customization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomization)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to save customization');
    }

    // Apply customization locally
    customizationData = newCustomization;
    applyCustomization(newCustomization);
    
    // Re-render gallery with new display mode
    if (currentProfile) {
      await loadProfile(currentProfile.username);
    }
    
    closeCustomizationModal();
    
    // Show success message
    alert('Profile customization saved successfully!');
  } catch (error) {
    console.error('Error saving customization:', error);
    alert('Error saving customization: ' + error.message);
  }
}

// Reset customization
async function resetCustomization() {
  if (!confirm('Are you sure you want to reset all customizations?')) {
    return;
  }
  
  const defaultCustomization = {
    backgroundImage: null,
    backgroundColor: '#000000',
    backgroundGradient: null,
    backgroundBlur: 20,
    overlayColor: '#000000',
    overlayOpacity: 50,
    nameFont: "'Inter', sans-serif",
    nameFontSize: '3.0rem',
    nameColor: '#ffffff',
    nameGradient: null,
    nameGlowColor: null,
    nameAnimation: '',
    galleryDisplay: 'grid',
    avatarGlowColor: '#8b5cf6',
    avatarGlowEnabled: true,
    profileEffect: '',
    profileIntro: '',
    showPnl: true,
    showNotes: true,
  };
  
  try {
    // Save to server
    const response = await fetch('/api/customization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultCustomization)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to reset customization');
    }

    customizationData = defaultCustomization;
    applyCustomization(defaultCustomization);
    
    // Reload form
    loadCustomizationForm();
    
    // Reload profile
    if (currentProfile) {
      await loadProfile(currentProfile.username);
    }
    
    alert('Customization reset successfully!');
  } catch (error) {
    console.error('Error resetting customization:', error);
    alert('Error resetting customization: ' + error.message);
  }
}

// Delete trade
async function deleteTrade(tradeId) {
  if (!confirm('Are you sure you want to delete this trade?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/trades/${tradeId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Reload profile
      if (currentProfile) {
        await loadProfile(currentProfile.username);
      }
    } else {
      alert(data.error || 'Error deleting trade');
    }
  } catch (error) {
    console.error('Error deleting trade:', error);
    alert('Error deleting trade');
  }
}

// Open image zoom modal
function openImageZoom(trade, showPnl, showNotes) {
  const modal = document.getElementById('imageZoomModal');
  const zoomedImage = document.getElementById('zoomedImage');
  const zoomPnl = document.getElementById('zoomPnl');
  const zoomNotes = document.getElementById('zoomNotes');
  
  // Set image
  if (trade.imageUrl) {
    zoomedImage.src = trade.imageUrl;
  } else {
    zoomedImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23000000"/%3E%3C/svg%3E';
  }
  
  // Set P&L
  if (showPnl) {
    const formattedPnl = formatPnL(trade.pnl);
    zoomPnl.textContent = formattedPnl;
    zoomPnl.className = `image-zoom-pnl ${formattedPnl.startsWith('+') ? 'positive' : 'negative'}`;
    zoomPnl.style.display = 'block';
  } else {
    zoomPnl.style.display = 'none';
  }
  
  // Set notes
  if (showNotes) {
    zoomNotes.textContent = trade.notes;
    zoomNotes.style.display = 'block';
  } else {
    zoomNotes.style.display = 'none';
  }
  
  // Show modal
  modal.classList.remove('hidden');
}

// Close image zoom modal
function closeImageZoom() {
  const modal = document.getElementById('imageZoomModal');
  modal.classList.add('hidden');
}

// Show premium warning modal
function showPremiumWarning() {
  const modal = document.getElementById('premiumWarningModal');
  modal.classList.remove('hidden');
}

// Close premium warning modal
function closePremiumWarning() {
  const modal = document.getElementById('premiumWarningModal');
  modal.classList.add('hidden');
}

// Toggle profile visibility
async function toggleVisibility() {
  const isPublic = customizationData.isProfilePublic !== false;
  const newVisibility = !isPublic;
  
  try {
    const response = await fetch('/api/profile/visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: newVisibility })
    });
    
    const data = await response.json();
    
    if (data.success) {
      customizationData.isProfilePublic = newVisibility;
      updateVisibilityButton(newVisibility);
    } else {
      alert(data.error || 'Error updating visibility');
    }
  } catch (error) {
    console.error('Error updating visibility:', error);
    alert('Error updating visibility');
  }
}

// Update visibility button
function updateVisibilityButton(isPublic) {
  const visibilityText = document.getElementById('visibilityText');
  const visibilityIcon = document.getElementById('visibilityIcon');
  
  if (isPublic) {
    visibilityText.textContent = 'Public';
    visibilityIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
  } else {
    visibilityText.textContent = 'Private';
    visibilityIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
  }
}

// Setup modal event listeners
export function setupCustomizationModal() {
  const closeModalBtn = document.getElementById('closeModal');
  const saveBtn = document.getElementById('saveCustomization');
  const resetBtn = document.getElementById('resetCustomization');
  const overlayOpacityInput = document.getElementById('overlayOpacityInput');
  const opacityValue = document.getElementById('opacityValue');
  const bgBlurInput = document.getElementById('bgBlurInput');
  const blurValue = document.getElementById('blurValue');
  const bgTypeInput = document.getElementById('bgTypeInput');
  const nameStyleInput = document.getElementById('nameStyleInput');
  const fontCategoryInput = document.getElementById('fontCategoryInput');
  const nameFontSizeInput = document.getElementById('nameFontSizeInput');
  const fontSizeValue = document.getElementById('fontSizeValue');
  const avatarGlowEnabled = document.getElementById('avatarGlowEnabled');
  const avatarGlowInput = document.getElementById('avatarGlowInput');
  const nameAnimationInput = document.getElementById('nameAnimationInput');
  const visibilityBtn = document.getElementById('visibilityBtn');
  
  // Setup drag & drop for background image
  setupImageDropZone();
  
  // Font size slider
  nameFontSizeInput.oninput = (e) => {
    fontSizeValue.textContent = parseFloat(e.target.value).toFixed(1);
    updateNamePreview();
  };
  
  // Setup premium warning modal
  const closePremiumWarningBtn = document.getElementById('closePremiumWarning');
  const closeWarningBtn = document.getElementById('closeWarningBtn');
  
  if (closePremiumWarningBtn) {
    closePremiumWarningBtn.onclick = closePremiumWarning;
  }
  
  if (closeWarningBtn) {
    closeWarningBtn.onclick = closePremiumWarning;
  }
  
  closeModalBtn.onclick = closeCustomizationModal;
  saveBtn.onclick = saveCustomization;
  resetBtn.onclick = resetCustomization;
  
  // Update opacity value display
  overlayOpacityInput.oninput = (e) => {
    opacityValue.textContent = e.target.value;
  };
  
  // Update blur value display
  bgBlurInput.oninput = (e) => {
    blurValue.textContent = e.target.value;
  };
  
  // Background type change
  bgTypeInput.onchange = (e) => {
    updateBackgroundTypeVisibility(e.target.value);
  };
  
  // Name style change
  nameStyleInput.onchange = (e) => {
    updateNameStyleVisibility(e.target.value);
    updateNamePreview();
  };
  
  // Font category change
  fontCategoryInput.onchange = (e) => {
    populateFontPreviews(e.target.value);
  };
  
  // Avatar glow changes
  avatarGlowEnabled.onchange = updateAvatarGlowPreview;
  avatarGlowInput.oninput = updateAvatarGlowPreview;
  
  // Avatar glow intensity
  const avatarGlowIntensityInput = document.getElementById('avatarGlowIntensityInput');
  const glowIntensityValue = document.getElementById('glowIntensityValue');
  if (avatarGlowIntensityInput) {
    avatarGlowIntensityInput.oninput = (e) => {
      glowIntensityValue.textContent = e.target.value;
      updateAvatarGlowPreview();
    };
  }
  
  // Avatar border color
  const avatarBorderColorInput = document.getElementById('avatarBorderColorInput');
  if (avatarBorderColorInput) {
    avatarBorderColorInput.oninput = updateAvatarGlowPreview;
  }
  
  // Name preview updates
  const nameInputs = [
    'nameColorInput',
    'nameGradientStart',
    'nameGradientEnd',
    'nameGlowColorInput'
  ];
  
  nameInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = updateNamePreview;
    }
  });
  
  nameAnimationInput.onchange = updateNamePreview;
  
  // Visibility button
  if (visibilityBtn) {
    visibilityBtn.onclick = toggleVisibility;
  }
  
  // Setup tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      const tabName = btn.dataset.tab;
      
      // Remove active from all
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active to selected
      btn.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    };
  });
  
  // Setup image zoom modal
  const closeZoomBtn = document.getElementById('closeZoom');
  const imageZoomModal = document.getElementById('imageZoomModal');
  
  if (closeZoomBtn) {
    closeZoomBtn.onclick = closeImageZoom;
  }
  
  if (imageZoomModal) {
    imageZoomModal.onclick = (e) => {
      // Close when clicking outside the image
      if (e.target === imageZoomModal) {
        closeImageZoom();
      }
    };
  }
}

// Setup image drop zone for drag & drop
function setupImageDropZone() {
  const dropZone = document.getElementById('bgImageDropZone');
  const fileInput = document.getElementById('bgImageFile');
  const browseBtn = document.getElementById('bgImageBrowse');
  const imageInput = document.getElementById('bgImageInput');
  const removeBtn = document.getElementById('bgImageRemove');
  const preview = document.getElementById('bgImagePreview');
  const previewImg = document.getElementById('bgImagePreviewImg');
  
  if (!dropZone) return;
  
  // Browse button
  browseBtn.onclick = () => {
    fileInput.click();
  };
  
  // File input change
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  };
  
  // Drag & drop
  dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  };
  
  dropZone.ondragleave = () => {
    dropZone.classList.remove('drag-over');
  };
  
  dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  };
  
  // Image URL input change
  imageInput.oninput = (e) => {
    if (e.target.value) {
      previewImg.src = e.target.value;
      preview.classList.remove('hidden');
      dropZone.style.display = 'none';
    }
  };
  
  // Remove button
  removeBtn.onclick = () => {
    imageInput.value = '';
    preview.classList.add('hidden');
    dropZone.style.display = 'block';
    fileInput.value = '';
  };
  
  // Handle image file
  function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target.result;
      imageInput.value = dataURL;
      previewImg.src = dataURL;
      preview.classList.remove('hidden');
      dropZone.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
}

// Check session and redirect if logged in
export async function checkSession() {
  try {
    const response = await fetch('/api/session');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user && data.user.username) {
        // User is logged in, redirect to their profile if on home page
        if (window.location.pathname === '/') {
          window.location.href = `/p/${data.user.username.toLowerCase()}`;
        }
      }
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }
}
