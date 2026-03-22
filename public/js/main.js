/* ============================================================
   AgroPan — Main Application Controller
   ============================================================
   Orchestrates navigation, smooth scrolling, active link
   highlighting, and counter animations. All DOM interactions
   are wired here to keep other modules pure logic.

   Dependencies: animations.js (scroll reveal)
   ============================================================ */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════════════════════════

  var navbar = document.getElementById('navbar');
  var navToggle = document.getElementById('nav-toggle');
  var navMobile = document.getElementById('nav-mobile');

  /**
   * Scroll handler — adds a subtle shadow and stronger
   * background to the navbar after scrolling 60px, so the
   * glass-morphism effect transitions smoothly.
   */
  function handleNavScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  /**
   * Mobile menu toggle — opens/closes the hamburger menu
   * and updates ARIA state for accessibility.
   */
  navToggle.addEventListener('click', function () {
    var isOpen = navMobile.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen);

    // Animate hamburger → X
    var bars = navToggle.querySelectorAll('span');
    if (isOpen) {
      bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      bars[1].style.opacity = '0';
      bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      bars[0].style.transform = '';
      bars[1].style.opacity = '';
      bars[2].style.transform = '';
    }
  });

  /**
   * Close mobile menu when a link inside it is clicked.
   */
  navMobile.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      navMobile.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      var bars = navToggle.querySelectorAll('span');
      bars[0].style.transform = '';
      bars[1].style.opacity = '';
      bars[2].style.transform = '';
    }
  });


  // ══════════════════════════════════════════════════════════
  // SMOOTH SCROLL — Enhanced anchor behavior
  // ══════════════════════════════════════════════════════════
  // Although CSS `scroll-behavior: smooth` handles basic
  // cases, we add JS-based offset handling so sections
  // don't hide behind the fixed navbar.

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      var navHeight = navbar.offsetHeight;
      var targetTop = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    });
  });


  // ══════════════════════════════════════════════════════════
  // ACTIVE NAV LINK HIGHLIGHTING
  // ══════════════════════════════════════════════════════════
  // Highlights the nav link corresponding to the section
  // currently in view.

  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.navbar__links a');

  function highlightActiveSection() {
    var scrollPos = window.scrollY + navbar.offsetHeight + 100;

    sections.forEach(function (section) {
      var top = section.offsetTop;
      var bottom = top + section.offsetHeight;
      var id = section.getAttribute('id');

      navLinks.forEach(function (link) {
        if (link.getAttribute('href') === '#' + id) {
          if (scrollPos >= top && scrollPos < bottom) {
            link.style.color = 'var(--color-primary)';
          } else {
            link.style.color = '';
          }
        }
      });
    });
  }

  window.addEventListener('scroll', highlightActiveSection, { passive: true });


  // ══════════════════════════════════════════════════════════
  // COUNTER ANIMATION — Hero stats
  // ══════════════════════════════════════════════════════════
  // Animates the hero stat numbers from 0 to their target
  // values when the page loads.

  function animateCounters() {
    var statValues = document.querySelectorAll('.hero__stat-value');

    statValues.forEach(function (el) {
      var text = el.textContent;
      var num = parseInt(text, 10);
      var suffix = text.replace(/[0-9]/g, ''); // e.g., "+", "yr"

      if (isNaN(num)) return;

      var current = 0;
      var duration = 1500;
      var start = null;

      function step(timestamp) {
        if (!start) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);

        // Ease-out curve for natural deceleration
        var eased = 1 - Math.pow(1 - progress, 3);
        current = Math.round(eased * num);

        el.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    });
  }

  // Run counter animation after a brief delay to let
  // the hero fade in first
  setTimeout(animateCounters, 600);

})();
