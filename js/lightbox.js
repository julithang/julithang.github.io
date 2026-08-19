document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const closeButton = lightbox.querySelector('.lightbox-close');
  let lastFocused = null;

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  const ZOOM_STEP = 2; // scale applied on click-to-zoom

  let scale = 1;
  let originX = 50; // % transform-origin, so zoom centers on the tap/click point
  let originY = 50;
  let panX = 0;
  let panY = 0;

  const applyTransform = () => {
    lightboxImg.style.transformOrigin = `${originX}% ${originY}%`;
    lightboxImg.style.transform = `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`;
  };

  const resetZoom = () => {
    scale = 1;
    originX = 50;
    originY = 50;
    panX = 0;
    panY = 0;
    lightboxImg.classList.remove('is-zoomed', 'is-panning');
    applyTransform();
  };

  const setScale = (next, clientX, clientY) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    if (clientX != null && clientY != null) {
      const rect = lightboxImg.getBoundingClientRect();
      originX = ((clientX - rect.left) / rect.width) * 100;
      originY = ((clientY - rect.top) / rect.height) * 100;
    }
    scale = clamped;
    if (scale === MIN_SCALE) {
      panX = 0;
      panY = 0;
    }
    lightboxImg.classList.toggle('is-zoomed', scale > MIN_SCALE);
    applyTransform();
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape') closeLightbox();
  };

  const openLightbox = (img) => {
    lastFocused = document.activeElement;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt;
    resetZoom();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    closeButton.focus();
    document.addEventListener('keydown', handleKeydown);
  };

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    resetZoom();
    document.removeEventListener('keydown', handleKeydown);
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('.lightbox-trigger').forEach((img) => {
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `View larger image: ${img.alt}`);

    img.addEventListener('click', () => openLightbox(img));
    img.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(img);
      }
    });
  });

  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  // Click/tap to zoom in on that point; click again to reset.
  let suppressClick = false;
  lightboxImg.addEventListener('click', (event) => {
    event.stopPropagation();
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (scale > MIN_SCALE) {
      resetZoom();
    } else {
      setScale(ZOOM_STEP, event.clientX, event.clientY);
    }
  });

  // Scroll / trackpad to zoom, centered on the cursor.
  lightbox.addEventListener(
    'wheel',
    (event) => {
      if (!lightboxImg.src) return;
      event.preventDefault();
      const next = scale - event.deltaY * 0.01;
      setScale(next, event.clientX, event.clientY);
    },
    { passive: false }
  );

  // Drag to pan once zoomed in — mouse/pen only; touch panning is handled
  // separately below alongside pinch, so the two gestures never collide.
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartX = 0;
  let panStartY = 0;

  lightboxImg.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') return;
    if (scale === MIN_SCALE) return;
    isDragging = true;
    suppressClick = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    panStartX = panX;
    panStartY = panY;
    lightboxImg.classList.add('is-panning');
    lightboxImg.setPointerCapture(event.pointerId);
  });

  lightboxImg.addEventListener('pointermove', (event) => {
    if (!isDragging || event.pointerType === 'touch') return;
    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) suppressClick = true;
    panX = panStartX + dx;
    panY = panStartY + dy;
    applyTransform();
  });

  const endDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    lightboxImg.classList.remove('is-panning');
    if (event && event.pointerId != null) {
      try {
        lightboxImg.releasePointerCapture(event.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  lightboxImg.addEventListener('pointerup', endDrag);
  lightboxImg.addEventListener('pointercancel', endDrag);

  // Touch: one finger pans (when zoomed), two fingers pinch-zoom.
  let pinchStartDistance = null;
  let pinchStartScale = 1;
  let touchPanStartX = 0;
  let touchPanStartY = 0;
  let touchPanOriginX = 0;
  let touchPanOriginY = 0;
  let touchMoved = false;

  const touchDistance = (touches) => {
    const [a, b] = touches;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const touchMidpoint = (touches) => {
    const [a, b] = touches;
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
  };

  lightboxImg.addEventListener(
    'touchstart',
    (event) => {
      touchMoved = false;
      if (event.touches.length === 2) {
        pinchStartDistance = touchDistance(event.touches);
        pinchStartScale = scale;
      } else if (event.touches.length === 1 && scale > MIN_SCALE) {
        touchPanStartX = event.touches[0].clientX;
        touchPanStartY = event.touches[0].clientY;
        touchPanOriginX = panX;
        touchPanOriginY = panY;
      }
    },
    { passive: true }
  );

  lightboxImg.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length === 2 && pinchStartDistance) {
        event.preventDefault();
        touchMoved = true;
        const distance = touchDistance(event.touches);
        const mid = touchMidpoint(event.touches);
        const next = pinchStartScale * (distance / pinchStartDistance);
        setScale(next, mid.x, mid.y);
      } else if (event.touches.length === 1 && scale > MIN_SCALE) {
        event.preventDefault();
        touchMoved = true;
        panX = touchPanOriginX + (event.touches[0].clientX - touchPanStartX);
        panY = touchPanOriginY + (event.touches[0].clientY - touchPanStartY);
        applyTransform();
      }
    },
    { passive: false }
  );

  lightboxImg.addEventListener('touchend', (event) => {
    if (touchMoved) suppressClick = true;
    if (event.touches.length < 2) pinchStartDistance = null;
  });
});
