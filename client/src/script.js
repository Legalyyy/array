// Import profile functionality
import { loadProfile, setupCustomizationModal, checkSession } from './profile.js';
import { initP5Logo } from './p5-logo.js';

// Title Fade-In Animation (Permanent, no fade-out)
const titleText = "escape";

function animateTitle() {
  const titleElement = document.getElementById("animated-title");
  if (!titleElement) return;

  titleElement.textContent = "";
  const chars = titleText.split("");

  chars.forEach((char, index) => {
    const span = document.createElement("span");
    span.textContent = char;
    span.style.opacity = "0";
    span.style.display = "inline-block";
    span.style.transition = "opacity 0.5s ease";
    titleElement.appendChild(span);

    setTimeout(() => {
      span.style.opacity = "1";
    }, index * 125);
  });
}

// Router - Check if we're on a profile page
function checkRoute() {
  const path = window.location.pathname;
  console.log('Current path:', path);
  
  // Check if path matches /p/(username) pattern (allows letters, numbers, dots, underscores, hyphens)
  const profileMatch = path.match(/^\/p\/([a-zA-Z0-9._-]+)$/);
  
  if (profileMatch) {
    const username = profileMatch[1];
    console.log('Showing profile for:', username);
    showProfilePage(username);
  } else {
    console.log('Showing home page');
    showHomePage();
  }
}

function showHomePage() {
  document.getElementById('home-page').classList.remove('hidden');
  document.getElementById('profile-page').classList.add('hidden');
}

function showProfilePage(username) {
  console.log('showProfilePage called for:', username);
  const homePage = document.getElementById('home-page');
  const profilePage = document.getElementById('profile-page');
  
  if (homePage && profilePage) {
    homePage.classList.add('hidden');
    profilePage.classList.remove('hidden');
    loadProfile(username);
  } else {
    console.error('Page elements not found!', { homePage, profilePage });
  }
}

// Login Button to Code Input Animation
function setupLoginAnimation() {
  const loginBtn = document.getElementById("loginButton");
  const codeInputContainer = document.getElementById("codeInput");
  const codeInput = document.getElementById("accessCode");
  const submitBtn = document.getElementById("submitCode");

  if (!loginBtn || !codeInputContainer) return;

  loginBtn.addEventListener("click", () => {
    loginBtn.style.opacity = "0";
    loginBtn.style.transform = "scale(0.8)";
    
    setTimeout(() => {
      loginBtn.style.display = "none";
      codeInputContainer.classList.remove("hidden");
      codeInput.focus();
    }, 400);
  });

  // Auto-format code input (XXX-XXX)
  codeInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    
    if (value.length > 3) {
      value = value.slice(0, 3) + "-" + value.slice(3, 6);
    }
    
    e.target.value = value;
  });

  // Submit code handler
  submitBtn.addEventListener("click", async () => {
    const code = codeInput.value;
    
    if (code.length === 7 && code.includes("-")) {
      // Disable button during request
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.5";
      
      try {
        const response = await fetch('/api/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Hide code input
          codeInputContainer.style.opacity = "0";
          codeInputContainer.style.transform = "scale(0.8)";
          
          setTimeout(() => {
            codeInputContainer.classList.add("hidden");
            
            // Show user profile
            const userProfile = document.getElementById("userProfile");
            const userAvatar = document.getElementById("userAvatar");
            const userName = document.getElementById("userName");
            
            userAvatar.src = data.user.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';
            userName.textContent = data.user.username;
            
            userProfile.classList.remove("hidden");
            
            // Redirect to profile page after 2 seconds
            setTimeout(() => {
              window.location.href = `/p/${data.user.username.toLowerCase()}`;
            }, 2000);
          }, 400);
        } else {
          alert(data.error || "Código inválido. Por favor verifica e intenta de nuevo.");
          submitBtn.disabled = false;
          submitBtn.style.opacity = "1";
        }
      } catch (error) {
        console.error("Error al verificar código:", error);
        alert("Error al verificar el código. Por favor intenta de nuevo.");
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
      }
    } else {
      alert("Por favor ingresa un código válido (formato: XXX-XXX)");
    }
  });

  // Allow Enter key to submit
  codeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      submitBtn.click();
    }
  });
}

// Initialize home page animations
function initializeHomeAnimations() {
  // Initialize p5.js logo
  initP5Logo('p5-logo-container');
  
  // Animate title on load
  animateTitle();

  // Setup login button animation
  setupLoginAnimation();

  // Check if GSAP is loaded
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error('GSAP or ScrollTrigger not loaded');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll with Lenis
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // Image rotation animation (optimized for smooth performance)
  gsap.set('.image-motion', {
    rotateX: 90,
    force3D: true,
  });

  gsap.to('.image-motion', {
    rotateX: 0,
    force3D: true,
    ease: 'none',
    scrollTrigger: {
      trigger: '.section2',
      start: 'top 90%',
      end: 'center center',
      scrub: 0.5,
      markers: false,
      invalidateOnRefresh: true,
    },
  });

  // Section 3 animations
  gsap.fromTo('.section3 .title', {
    opacity: 0,
    y: 50,
  }, {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.section3',
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none reverse',
    },
  });

  gsap.fromTo('.section3 .subtitle', {
    opacity: 0,
    y: 30,
  }, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    delay: 0.3,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.section3',
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none reverse',
    },
  });

  gsap.fromTo('.section3 .text', {
    opacity: 0,
    y: 30,
  }, {
    opacity: 1,
    y: 0,
    stagger: 0.2,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.text-content',
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none reverse',
    },
  });

  gsap.fromTo('.login-container', {
    opacity: 0,
    y: 50,
    scale: 0.9,
  }, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.login-container',
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none reverse',
    },
  });
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Check session first
  await checkSession();
  
  // Check route and show appropriate page
  checkRoute();
  
  // Setup customization modal
  setupCustomizationModal();
  
  // If on home page, initialize animations
  if (!document.getElementById('home-page').classList.contains('hidden')) {
    initializeHomeAnimations();
  }
});
