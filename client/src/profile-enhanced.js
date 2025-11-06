// Enhanced Profile System with Advanced Customization
import { ProfileCustomization } from './profile-customization.js';

// Profile customization instance
const customizer = new ProfileCustomization();
let currentProfile = null;
let customizationData = {};

// Load user profile with all premium features
export async function loadProfile(username) {
  try {
    const response = await fetch(`/api/profile/${username}`);
    const data = await response.json();
    
    if (!data.success) {
      showNotification(data.error || 'User not found', 'error');
      window.location.href = '/';
      return;
    }
    
    currentProfile = data.user;
    customizationData = data.user.customization || {};
    
    // Initialize customizer with profile data
    customizer.init(data.user, customizationData);
    
    // Display profile info
    displayProfileInfo(data.user);
    
    // Setup buttons
    setupProfileButtons(data.user);
    
    // Render gallery
    renderGallery(data.user);
    
  } catch (error) {
    console.error('Error loading profile:', error);
    showNotification('Error loading profile', 'error');
    window.location.href = '/';
  }
}

// Display profile information
function displayProfileInfo(user) {
  document.getElementById('profileUsername').textContent = user.username;
  document.getElementById('totalTrades').textContent = user.totalTrades;
  
  const profileAvatar = document.getElementById('profileAvatar');
  if (user.avatarUrl) {
    profileAvatar.src = user.avatarUrl;
  } else {
    profileAvatar.src = `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`;
  }
  
  // Show premium badge
  if (user.isPremium) {
    document.getElementById('premiumBadge').classList.remove('hidden');
  }
}

// Setup profile action buttons
function setupProfileButtons(user) {
  const customizeBtn = document.getElementById('customizeBtn');
  const visibilityBtn = document.getElementById('visibilityBtn');
  const lockIcon = document.getElementById('lockIcon');
  const customizeBtnText = document.getElementById('customizeBtnText');
  
  if (user.isOwnProfile) {
    // Show visibility button (always available)
    visibilityBtn.classList.remove('hidden');
    updateVisibilityButton(customizationData.isProfilePublic !== false);
    visibilityBtn.onclick = toggleProfileVisibility;
    
    // Setup customize button
    if (user.isPremium) {
      customizeBtn.classList.remove('locked');
      lockIcon.classList.add('hidden');
      customizeBtn.onclick = openCustomizationModal;
    } else {
      customizeBtn.classList.add('locked');
      lockIcon.classList.remove('hidden');
      customizeBtnText.textContent = 'Locked';
      customizeBtn.onclick = showPremiumWarning;
    }
  } else {
    // Hide buttons for other profiles
    customizeBtn.style.display = 'none';
    visibilityBtn.style.display = 'none';
  }
}

// Toggle profile visibility
async function toggleProfileVisibility() {
  const currentVisibility = customizationData.isProfilePublic !== false;
  const newVisibility = !currentVisibility;
  
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
      showNotification(`Profile is now ${newVisibility ? 'public' : 'private'}`, 'success');
    } else {
      showNotification(data.error || 'Failed to update visibility', 'error');
    }
  } catch (error) {
    console.error('Error updating visibility:', error);
    showNotification('Error updating visibility', 'error');
  }
}

// Update visibility button appearance
function updateVisibilityButton(isPublic) {
  const visibilityIcon = document.getElementById('visibilityIcon');
  const visibilityText = document.getElementById('visibilityText');
  
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

// Render gallery
function renderGallery(user) {
  const profileGallery = document.getElementById('profileGallery');
  profileGallery.innerHTML = '';
  
  const galleryDisplay = customizationData.galleryDisplay || 'grid';
  profileGallery.className = 'profile-gallery-modern';
  if (galleryDisplay === 'masonry') {
    profileGallery.classList.add('masonry');
  } else if (galleryDisplay === 'list') {
    profileGallery.classList.add('list');
  }
  
  user.trades.forEach(trade => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    const img = document.createElement('img');
    if (trade.imageUrl) {
      img.src = trade.imageUrl;
      img.alt = `Trade ${trade.id}`;
    } else {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23000000"/%3E%3C/svg%3E';
      img.alt = 'No screenshot';
    }
    
    item.onclick = () => openImageZoom(trade);
    item.appendChild(img);
    
    const overlay = document.createElement('div');
    overlay.className = 'gallery-item-overlay';
    
    const pnl = document.createElement('div');
    pnl.className = `trade-pnl ${trade.pnl.startsWith('+') || (trade.pnl.startsWith('$') && !trade.pnl.includes('-')) ? 'positive' : 'negative'}`;
    pnl.textContent = trade.pnl;
    overlay.appendChild(pnl);
    
    const notes = document.createElement('div');
    notes.className = 'trade-notes';
    notes.textContent = trade.notes;
    overlay.appendChild(notes);
    
    item.appendChild(overlay);
    
    if (user.isOwnProfile) {
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

// Open customization modal
function openCustomizationModal() {
  const modal = document.getElementById('customizationModal');
  modal.classList.remove('hidden');
  
  // Load current customization
  document.getElementById('bgImageInput').value = customizationData.backgroundImage || '';
  document.getElementById('bgColorInput').value = customizationData.backgroundColor || '#000000';
  document.getElementById('overlayColorInput').value = customizationData.overlayColor || '#000000';
  document.getElementById('overlayOpacityInput').value = customizationData.overlayOpacity || 50;
  document.getElementById('opacityValue').textContent = customizationData.overlayOpacity || 50;
  document.getElementById('nameFontInput').value = customizationData.nameFont || "'Inter', sans-serif";
  document.getElementById('nameColorInput').value = customizationData.nameColor || '#ffffff';
  document.getElementById('avatarGlowInput').value = customizationData.avatarGlowColor || '#8b5cf6';
  document.getElementById('profileEffectInput').value = customizationData.profileEffect || '';
  document.getElementById('galleryDisplayInput').value = customizationData.galleryDisplay || 'grid';
  
  updateAvatarGlowPreview();
}

// Close modal with animation
function closeCustomizationModal() {
  const modal = document.getElementById('customizationModal');
  modal.classList.add('closing');
  
  setTimeout(() => {
    modal.classList.remove('closing');
    modal.classList.add('hidden');
  }, 300);
}

// Save customization
async function saveCustomization() {
  const newCustomization = {
    backgroundImage: document.getElementById('bgImageInput').value,
    backgroundColor: document.getElementById('bgColorInput').value,
    overlayColor: document.getElementById('overlayColorInput').value,
    overlayOpacity: parseInt(document.getElementById('overlayOpacityInput').value),
    nameFont: document.getElementById('nameFontInput').value,
    nameColor: document.getElementById('nameColorInput').value,
    avatarGlowColor: document.getElementById('avatarGlowInput').value,
    profileEffect: document.getElementById('profileEffectInput').value,
    galleryDisplay: document.getElementById('galleryDisplayInput').value,
  };
  
  try {
    const response = await fetch('/api/customization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomization)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to save customization');
    }
    
    // Apply with animation
    customizationData = newCustomization;
    customizer.applyCustomization(newCustomization, true);
    
    // Start effect
    if (newCustomization.profileEffect) {
      customizer.startEffect(newCustomization.profileEffect);
    } else {
      customizer.stopEffect();
    }
    
    // Re-render gallery
    if (currentProfile) {
      renderGallery(currentProfile);
    }
    
    closeCustomizationModal();
    showNotification('Profile customization saved!', 'success');
  } catch (error) {
    console.error('Error saving customization:', error);
    showNotification('Error saving customization: ' + error.message, 'error');
  }
}

// Reset customization
function resetCustomization() {
  if (!confirm('Reset all customizations?')) return;
  
  customizationData = {};
  customizer.applyCustomization({}, true);
  customizer.stopEffect();
  
  // Reset form
  document.getElementById('bgImageInput').value = '';
  document.getElementById('bgColorInput').value = '#000000';
  document.getElementById('overlayColorInput').value = '#000000';
  document.getElementById('overlayOpacityInput').value = 50;
  document.getElementById('opacityValue').textContent = 50;
  document.getElementById('nameFontInput').value = "'Inter', sans-serif";
  document.getElementById('nameColorInput').value = '#ffffff';
  document.getElementById('avatarGlowInput').value = '#8b5cf6';
  document.getElementById('profileEffectInput').value = '';
  document.getElementById('galleryDisplayInput').value = 'grid';
  
  const profileGallery = document.getElementById('profileGallery');
  profileGallery.className = 'profile-gallery-modern';
  
  updateAvatarGlowPreview();
  showNotification('Customization reset', 'success');
}

// Delete trade
async function deleteTrade(tradeId) {
  if (!confirm('Delete this trade?')) return;
  
  try {
    const response = await fetch(`/api/trades/${tradeId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (currentProfile) {
        await loadProfile(currentProfile.username);
      }
      showNotification('Trade deleted', 'success');
    } else {
      showNotification(data.error || 'Error deleting trade', 'error');
    }
  } catch (error) {
    console.error('Error deleting trade:', error);
    showNotification('Error deleting trade', 'error');
  }
}

// Open image zoom
function openImageZoom(trade) {
  const modal = document.getElementById('imageZoomModal');
  const zoomedImage = document.getElementById('zoomedImage');
  const zoomPnl = document.getElementById('zoomPnl');
  const zoomNotes = document.getElementById('zoomNotes');
  
  if (trade.imageUrl) {
    zoomedImage.src = trade.imageUrl;
  } else {
    zoomedImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23000000"/%3E%3C/svg%3E';
  }
  
  zoomPnl.textContent = trade.pnl;
  zoomPnl.className = `image-zoom-pnl ${trade.pnl.startsWith('+') || (trade.pnl.startsWith('$') && !trade.pnl.includes('-')) ? 'positive' : 'negative'}`;
  zoomNotes.textContent = trade.notes;
  
  modal.classList.remove('hidden');
}

// Close image zoom
function closeImageZoom() {
  document.getElementById('imageZoomModal').classList.add('hidden');
}

// Show premium warning
function showPremiumWarning() {
  document.getElementById('premiumWarningModal').classList.remove('hidden');
}

// Close premium warning
function closePremiumWarning() {
  document.getElementById('premiumWarningModal').classList.add('hidden');
}

// Update avatar glow preview
function updateAvatarGlowPreview() {
  const preview = document.getElementById('avatarGlowPreview');
  const glowColor = document.getElementById('avatarGlowInput').value;
  preview.style.boxShadow = `0 0 30px ${glowColor}, 0 0 60px ${glowColor}40, 0 0 90px ${glowColor}20`;
}

// Show notification
function showNotification(message, type = 'info') {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = `notification-toast ${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? 'rgba(34, 197, 94, 0.95)' : type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Setup event listeners
export function setupCustomizationModal() {
  document.getElementById('closeModal').onclick = closeCustomizationModal;
  document.getElementById('saveCustomization').onclick = saveCustomization;
  document.getElementById('resetCustomization').onclick = resetCustomization;
  
  document.getElementById('closePremiumWarning')?.addEventListener('click', closePremiumWarning);
  document.getElementById('closeWarningBtn')?.addEventListener('click', closePremiumWarning);
  
  // Opacity slider
  document.getElementById('overlayOpacityInput').oninput = (e) => {
    document.getElementById('opacityValue').textContent = e.target.value;
  };
  
  // Avatar glow preview
  document.getElementById('avatarGlowInput').oninput = updateAvatarGlowPreview;
  
  // Effect preview button
  document.getElementById('previewEffectBtn')?.addEventListener('click', () => {
    const effect = document.getElementById('profileEffectInput').value;
    if (effect) {
      customizer.startEffect(effect);
      showNotification('Effect preview started! Save to keep it.', 'info');
    } else {
      customizer.stopEffect();
      showNotification('Effect stopped', 'info');
    }
  });
  
  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      const tabName = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    };
  });
  
  // Image zoom modal
  document.getElementById('closeZoom')?.addEventListener('click', closeImageZoom);
  document.getElementById('imageZoomModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'imageZoomModal') closeImageZoom();
  });
}

// Check session
export async function checkSession() {
  try {
    const response = await fetch('/api/session');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user?.username) {
        if (window.location.pathname === '/') {
          window.location.href = `/p/${data.user.username.toLowerCase()}`;
        }
      }
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.profile-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.visibility-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: white;
  transition: all 0.3s ease;
}

.customize-btn.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

small {
  display: block;
  margin-top: 4px;
  color: rgba(255,255,255,0.6);
  font-size: 12px;
}
`;
document.head.appendChild(style);
