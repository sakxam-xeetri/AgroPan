/* ============================================================
   AgroPan — Scroll Animations
   ============================================================
   Uses the Intersection Observer API (no external libraries)
   to reveal elements as they enter the viewport.

   Two patterns:
     1. `.reveal`          — single element fades in + slides up
     2. `.reveal-stagger`  — container whose children animate
                             in sequence (stagger via CSS delays)
   ============================================================ */

(function () {
  'use strict';

  /**
   * observerCallback
   * Handles intersection events for reveal-animated elements.
   * Once an element is revealed, we unobserve it so the
   * animation only fires once (better performance).
   */
  function observerCallback(entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }

  /**
   * initScrollReveal
   * Finds all `.reveal` and `.reveal-stagger` elements and
   * registers them with an Intersection Observer.
   *
   * threshold: 0.15 — element must be 15% visible before
   *   triggering, which feels natural while scrolling.
   */
  function initScrollReveal() {
    // Guard: Intersection Observer not supported (very old browsers)
    if (!('IntersectionObserver' in window)) {
      // Fallback: just reveal everything immediately
      document.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) {
        el.classList.add('is-revealed');
      });
      return;
    }

    var options = {
      root: null,         // viewport
      rootMargin: '0px 0px -60px 0px', // trigger slightly before fully visible
      threshold: 0.15
    };

    var observer = new IntersectionObserver(observerCallback, options);

    // Observe single-reveal elements
    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });

    // Observe stagger containers
    document.querySelectorAll('.reveal-stagger').forEach(function (el) {
      observer.observe(el);
    });
  }

  // ── Initialize on DOM ready ──────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollReveal);
  } else {
    initScrollReveal();
  }

})();
