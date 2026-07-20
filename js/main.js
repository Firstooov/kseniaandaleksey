document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('hidden'), 350);
  });
  // fallback in case 'load' already fired or takes too long
  setTimeout(() => preloader && preloader.classList.add('hidden'), 2500);

  /* ---------- Missing media fallback ---------- */
  // A local 404 can resolve before this script attaches its listener, so
  // check the already-settled state first and only listen for future
  // errors when the image is still in flight.
  document.querySelectorAll('img[data-fallback-name]:not(.hero-photo)').forEach(img => {
    if (img.complete) {
      if (img.naturalWidth === 0) showMediaPlaceholder(img, img.dataset.fallbackName);
    } else {
      img.addEventListener('error', () => showMediaPlaceholder(img, img.dataset.fallbackName), { once: true });
    }
  });

  function showMediaPlaceholder(el, name) {
    const parent = el.parentElement;
    el.style.display = 'none';
    const box = document.createElement('div');
    box.className = 'media-missing';
    box.innerHTML = `<span class="mm-icon">❤</span><span>Замените на фото</span><code>${name}</code>`;
    parent.appendChild(box);
  }

  const video = document.getElementById('mainVideo');
  const videoPlaceholder = document.getElementById('videoPlaceholder');
  if (video) {
    const source = video.querySelector('source');
    const testVideo = document.createElement('video');
    testVideo.addEventListener('error', () => { video.style.display = 'none'; });
    testVideo.addEventListener('loadedmetadata', () => { videoPlaceholder.style.display = 'none'; });
    testVideo.src = source.src;
    testVideo.load();
    // if metadata never loads (missing file), keep placeholder visible; if it errors, show placeholder too
    testVideo.addEventListener('error', () => { videoPlaceholder.style.display = 'flex'; });
  }
  const heroPhoto = document.querySelector('.hero-photo');
  if (heroPhoto) {
    const heroFallback = () => {
      heroPhoto.style.display = 'none';
      document.querySelector('.hero-bg').style.background = 'radial-gradient(circle at 50% 30%, #221c14, #0b0a08)';
    };
    if (heroPhoto.complete) {
      if (heroPhoto.naturalWidth === 0) heroFallback();
    } else {
      heroPhoto.addEventListener('error', heroFallback, { once: true });
    }
  }

  /* ---------- Header scroll state + progress bar ---------- */
  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progressBar');
  const backToTop = document.getElementById('backToTop');

  function onScroll() {
    const scrollTop = window.scrollY;
    header.classList.toggle('scrolled', scrollTop > 40);
    backToTop.classList.toggle('visible', scrollTop > 600);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  document.getElementById('scrollDown').addEventListener('click', () => {
    document.getElementById('stats').scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- Mobile nav ---------- */
  const burger = document.getElementById('navBurger');
  const mainNav = document.getElementById('mainNav');
  burger.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      burger.classList.remove('open');
    });
  });

  /* ---------- Hero parallax ---------- */
  if (heroPhoto) {
    document.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        heroPhoto.style.transform = `scale(1.08) translateY(${y * 0.15}px)`;
      }
    }, { passive: true });
  }

  /* ---------- Live "days together" counter ---------- */
  const counterEl = document.getElementById('liveCounter');
  const startDate = new Date(counterEl.dataset.start);
  const elDays = document.getElementById('cDays');
  const elHours = document.getElementById('cHours');
  const elMins = document.getElementById('cMins');
  const elSecs = document.getElementById('cSecs');
  const statDays = document.getElementById('statDays');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tickCounter() {
    const diff = Date.now() - startDate.getTime();
    if (diff < 0) return;
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    elDays.textContent = days;
    elHours.textContent = pad(hours);
    elMins.textContent = pad(mins);
    elSecs.textContent = pad(secs);
    if (statDays) statDays.textContent = days;
  }
  tickCounter();
  setInterval(tickCounter, 1000);

  /* ---------- Auto stat counts from actual content ---------- */
  const photoCount = document.querySelectorAll('.gallery-item').length;
  const momentCount = document.querySelectorAll('.timeline-item').length;
  const statPhotos = document.getElementById('statPhotos');
  const statMoments = document.getElementById('statMoments');
  if (statPhotos) statPhotos.dataset.countTarget = photoCount;
  if (statMoments) statMoments.dataset.countTarget = momentCount;

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const countUpEls = document.querySelectorAll('[data-count-target]');
  const countedUp = new WeakSet();

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        if (entry.target.hasAttribute('data-count-target') && !countedUp.has(entry.target)) {
          countedUp.add(entry.target);
          animateCount(entry.target);
        }
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => io.observe(el));
  countUpEls.forEach(el => io.observe(el));

  function animateCount(el) {
    const target = parseInt(el.dataset.countTarget, 10) || 0;
    const duration = 1100;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Timeline line growth ---------- */
  const timelineTrack = document.getElementById('timelineTrack');
  const timelineLine = document.getElementById('timelineLine');
  if (timelineTrack && timelineLine) {
    function updateTimelineLine() {
      const rect = timelineTrack.getBoundingClientRect();
      const vh = window.innerHeight;
      const visible = Math.min(Math.max(vh * 0.75 - rect.top, 0), rect.height);
      const pct = rect.height > 0 ? (visible / rect.height) * 100 : 0;
      timelineLine.style.height = pct + '%';
    }
    document.addEventListener('scroll', updateTimelineLine, { passive: true });
    window.addEventListener('resize', updateTimelineLine);
    updateTimelineLine();
  }

  /* ---------- Gallery lightbox ---------- */
  const galleryImgs = Array.from(document.querySelectorAll('.gallery-item img'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    const img = galleryImgs[currentIndex];
    if (!img || img.style.display === 'none') return;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function showRelative(delta) {
    let next = currentIndex;
    for (let i = 0; i < galleryImgs.length; i++) {
      next = (next + delta + galleryImgs.length) % galleryImgs.length;
      if (galleryImgs[next].style.display !== 'none') break;
    }
    openLightbox(next);
  }

  galleryImgs.forEach((img, i) => {
    img.closest('.gallery-item').addEventListener('click', () => openLightbox(i));
  });
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => showRelative(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => showRelative(1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showRelative(-1);
    if (e.key === 'ArrowRight') showRelative(1);
  });

  /* ---------- Letter modal ---------- */
  const letterModal = document.getElementById('letterModal');
  const openLetterBtn = document.getElementById('openLetterBtn');
  const letterClose = document.getElementById('letterClose');
  const letterBackdrop = document.getElementById('letterBackdrop');

  function openLetter() {
    letterModal.classList.add('open');
    letterModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLetter() {
    letterModal.classList.remove('open');
    letterModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  openLetterBtn.addEventListener('click', openLetter);
  letterClose.addEventListener('click', closeLetter);
  letterBackdrop.addEventListener('click', closeLetter);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && letterModal.classList.contains('open')) closeLetter();
  });

  /* ---------- Music player ---------- */
  const music = document.getElementById('bgMusic');
  const musicToggle = document.getElementById('musicToggle');
  let musicOn = false;

  musicToggle.addEventListener('click', () => {
    if (!musicOn) {
      music.play().then(() => {
        musicOn = true;
        musicToggle.classList.add('playing');
        musicToggle.setAttribute('aria-pressed', 'true');
      }).catch(() => {
        /* file missing or blocked — silently ignore */
      });
    } else {
      music.pause();
      musicOn = false;
      musicToggle.classList.remove('playing');
      musicToggle.setAttribute('aria-pressed', 'false');
    }
  });

  /* ---------- Smooth-scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

});
