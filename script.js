/**
 * DMFlux Campaign Landing Page - Core JavaScript
 * Lightweight, performant vanilla ES6+ script with modern Web APIs.
 *
 * Requirements implemented:
 * 1. Scroll Reveal Animation: Intersection Observer with prefers-reduced-motion support
 * 2. FAQ Accordion: Single active item with dynamic maxHeight animation
 * 3. Mobile Sticky CTA: Shows past hero, hides during FAQ & footer view
 * 4. Smooth Scroll: Native smooth scroll with 64px fixed header offset
 * 5. Lazy Loading: Progressive loading="lazy" for images and video intersection loading
 * 6. Video Play/Pause: Toggle on click in .proof__video-card with play overlay sync
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Scroll Reveal Animation
  // ---------------------------------------------------------------------------
  const initScrollReveal = () => {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    // Immediately reveal all elements if reduced motion is preferred or if unsupported
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    reveals.forEach((el) => observer.observe(el));
  };

  // ---------------------------------------------------------------------------
  // 2. FAQ Accordion
  // ---------------------------------------------------------------------------
  const initFaqAccordion = () => {
    const items = document.querySelectorAll('.faq__item');
    if (!items.length) return;

    const closeItem = (item) => {
      item.classList.remove('active');
      const btn = item.querySelector('.faq__question');
      const ans = item.querySelector('.faq__answer');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (ans) {
        ans.style.maxHeight = '0px';
        ans.setAttribute('aria-hidden', 'true');
      }
    };

    const openItem = (item) => {
      item.classList.add('active');
      const btn = item.querySelector('.faq__question');
      const ans = item.querySelector('.faq__answer');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      if (ans) {
        ans.style.maxHeight = `${ans.scrollHeight}px`;
        ans.setAttribute('aria-hidden', 'false');
      }
    };

    items.forEach((item) => {
      const btn = item.querySelector('.faq__question');
      const ans = item.querySelector('.faq__answer');
      if (!btn || !ans) return;

      const isActive = item.classList.contains('active');
      btn.setAttribute('aria-expanded', String(isActive));
      ans.setAttribute('aria-hidden', String(!isActive));
      ans.style.maxHeight = isActive ? `${ans.scrollHeight}px` : '0px';

      btn.addEventListener('click', () => {
        const isCurrentActive = item.classList.contains('active');

        // Close all other FAQ items (only one item active at a time)
        items.forEach((sibling) => {
          if (sibling !== item && sibling.classList.contains('active')) {
            closeItem(sibling);
          }
        });

        // Toggle clicked item
        if (isCurrentActive) {
          closeItem(item);
        } else {
          openItem(item);
        }
      });
    });

    // Recalculate open answer height on window resize to avoid text clipping
    window.addEventListener('resize', () => {
      const activeAns = document.querySelector('.faq__item.active .faq__answer');
      if (activeAns) {
        activeAns.style.maxHeight = `${activeAns.scrollHeight}px`;
      }
    }, { passive: true });
  };

  // ---------------------------------------------------------------------------
  // 3. Mobile Sticky CTA Bar
  // ---------------------------------------------------------------------------
  const initStickyCTA = () => {
    const cta = document.querySelector('.sticky-cta');
    if (!cta) return;

    const hero = document.querySelector('.hero');
    const faq = document.querySelector('.faq');
    const footer = document.querySelector('.footer');

    let heroVisible = true;
    let faqVisible = false;
    let footerVisible = false;

    const updateCTA = () => {
      // Show only when scrolled past hero and neither FAQ nor footer is in view
      const shouldShow = !heroVisible && !faqVisible && !footerVisible;
      cta.classList.toggle('visible', shouldShow);
    };

    if (!hero) {
      heroVisible = false;
      updateCTA();
    }

    if (!('IntersectionObserver' in window)) {
      // Graceful fallback for older browsers
      window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 300;
        const faqRect = faq ? faq.getBoundingClientRect() : null;
        const footerRect = footer ? footer.getBoundingClientRect() : null;
        const vh = window.innerHeight;

        const isFaqIn = faqRect ? faqRect.top < vh && faqRect.bottom > 0 : false;
        const isFooterIn = footerRect ? footerRect.top < vh && footerRect.bottom > 0 : false;
        cta.classList.toggle('visible', scrollY > heroBottom && !isFaqIn && !isFooterIn);
      }, { passive: true });
      return;
    }

    // Hero observer: triggers as soon as hero enters or leaves viewport
    if (hero) {
      new IntersectionObserver(
        ([entry]) => {
          heroVisible = entry.isIntersecting;
          updateCTA();
        },
        { threshold: 0 }
      ).observe(hero);
    }

    // Observer for FAQ and Footer sections
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (faq && (entry.target === faq || entry.target.closest('.faq') === faq)) {
            faqVisible = entry.isIntersecting;
          }
          if (footer && (entry.target === footer || entry.target.closest('.footer') === footer)) {
            footerVisible = entry.isIntersecting;
          }
          updateCTA();
        });
      },
      { threshold: 0 }
    );

    if (faq) sectionObserver.observe(faq);
    if (footer) sectionObserver.observe(footer);
  };

  // ---------------------------------------------------------------------------
  // 4. Smooth Scroll for Anchor Links (64px Header Offset)
  // ---------------------------------------------------------------------------
  const initSmoothScroll = () => {
    const HEADER_OFFSET = 64; // Fixed navigation header height in pixels

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;

        if (targetId === '#top') {
          e.preventDefault();
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          });
          return;
        }

        try {
          const target = document.querySelector(targetId);
          if (!target) return;

          e.preventDefault();

          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const targetPos = target.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;

          window.scrollTo({
            top: Math.max(0, targetPos),
            behavior: prefersReduced ? 'auto' : 'smooth',
          });

          if (window.history.pushState) {
            window.history.pushState(null, '', targetId);
          }

          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        } catch (_) {
          // If selector syntax fails, fall back to native browser anchor behavior
        }
      });
    });
  };

  // ---------------------------------------------------------------------------
  // 5. Lazy Loading Setup (Images & Videos)
  // ---------------------------------------------------------------------------
  const initLazyLoading = () => {
    // 5a. Progressive image lazy loading: apply loading="lazy" where omitted
    document.querySelectorAll('img:not([loading])').forEach((img) => {
      img.setAttribute('loading', 'lazy');
    });

    // 5b. Video lazy loading via Intersection Observer
    const videos = document.querySelectorAll('video');
    if (!videos.length) return;

    const loadVideo = (video) => {
      let reload = false;

      if (video.dataset.src) {
        video.src = video.dataset.src;
        video.removeAttribute('data-src');
        reload = true;
      }

      video.querySelectorAll('source[data-src]').forEach((src) => {
        src.src = src.dataset.src;
        src.removeAttribute('data-src');
        reload = true;
      });

      if (video.getAttribute('preload') === 'none') {
        video.setAttribute('preload', 'metadata');
        reload = true;
      }

      if (reload) {
        video.load();
      }
    };

    if (!('IntersectionObserver' in window)) {
      videos.forEach(loadVideo);
      return;
    }

    const videoObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadVideo(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px 0px', threshold: 0.1 }
    );

    videos.forEach((video) => {
      if (!video.hasAttribute('preload') && !video.dataset.src) {
        video.setAttribute('preload', 'none');
      }
      videoObserver.observe(video);
    });
  };

  // ---------------------------------------------------------------------------
  // 6. Video Play/Pause on Click (.proof__video-card)
  // ---------------------------------------------------------------------------
  const initProofVideos = () => {
    const cards = document.querySelectorAll('.proof__video-card');
    if (!cards.length) return;

    cards.forEach((card) => {
      const video = card.querySelector('video');
      if (!video) return;

      const overlay = card.querySelector(
        '.proof__video-overlay, .video-overlay, .play-overlay, .proof__play-btn, [class*="overlay"], [class*="play"]'
      );

      const setPlaying = (isPlaying) => {
        card.classList.toggle('is-playing', isPlaying);
        if (overlay) {
          overlay.classList.toggle('hidden', isPlaying);
          overlay.classList.toggle('is-hidden', isPlaying);
          overlay.setAttribute('aria-hidden', String(isPlaying));
          overlay.style.opacity = isPlaying ? '0' : '1';
          overlay.style.pointerEvents = isPlaying ? 'none' : 'auto';
        }
      };

      const togglePlay = () => {
        if (video.paused || video.ended) {
          // Pause any other playing video across all proof cards
          document.querySelectorAll('.proof__video-card video').forEach((otherVideo) => {
            if (otherVideo !== video && !otherVideo.paused) {
              otherVideo.pause();
            }
          });

          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => setPlaying(false));
          }
        } else {
          video.pause();
        }
      };

      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button:not([class*="play"]), input')) return;
        togglePlay();
      });

      video.addEventListener('play', () => setPlaying(true));
      video.addEventListener('pause', () => setPlaying(false));
      video.addEventListener('ended', () => setPlaying(false));

      setPlaying(!video.paused);
    });
  };

  // ---------------------------------------------------------------------------
  // Initialize All Features
  // ---------------------------------------------------------------------------
  initScrollReveal();
  initFaqAccordion();
  initStickyCTA();
  initSmoothScroll();
  initLazyLoading();
  initProofVideos();
});
