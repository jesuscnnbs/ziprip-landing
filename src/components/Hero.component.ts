import { Component, signal, ElementRef, afterNextRender } from '@angular/core';
import type { OnInit } from '@angular/core';
import { gsap } from 'gsap';
import { ZipRip3DTextComponent } from './ZipRip3DText.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ZipRip3DTextComponent],
  template: `
    <div class="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-lighter via-primary to-primary-darker">
      <!-- Animated background elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="blob blob-1 absolute w-96 h-96 bg-white/20 rounded-full blur-2xl"></div>
        <div class="blob blob-2 absolute w-96 h-96 bg-neutral-400/20 rounded-full blur-3xl"></div>
        <div class="blob blob-3 absolute w-96 h-96 bg-zinc-300/20 rounded-full blur-3xl"></div>
      </div>

      <!-- Hero content -->
      <div class="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <!-- Logo/Brand - Behind text -->
        <div class="hero-logo absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 z-0">
          <img src="/lips.jpg" alt="ZipRip Logo" class="w-64 h-64 md:w-96 md:h-96 opacity-60 border-4 border-primary rounded-full" />
        </div>

        <!-- 3D Text Title -->
        <div class="hero-3d-text relative z-10 w-full h-88 md:h-112 my-6">
          <app-ziprip-3d-text />
        </div>

        <!-- Subtitle -->
        <p class="hero-subtitle gabriela-regular drop-shadow-[0px_0px_1px_white] text-xl md:text-2xl text-primary-content mb-12 opacity-0 translate-y-8 max-w-2xl mx-auto">
          Análisis y crítica de la industria del videojuego desde el humor y el más puro hate.
          <span class="text-primary-content font-semibold underline decoration-2 decoration-white/50">Sin filtros. </span>
          <span class="text-primary-content font-semibold underline decoration-2 decoration-neutral-200/50"> Del cutrerío me fío.</span>
        </p>

        <!-- CTA Buttons -->
        <div class="hero-cta flex flex-col sm:flex-row gap-4 justify-center opacity-0 translate-y-8">
          <button class="cta-button px-8 py-4 bg-white text-black font-bold rounded-lg shadow-lg border-2 border-black hover:bg-neutral-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex gap-2 items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            Suscríbete
          </button>
          <button class="cta-button px-8 py-4 bg-transparent backdrop-blur-sm text-white font-bold rounded-lg border-2 border-white/60 hover:bg-white/10 hover:border-white transition-all duration-300 flex gap-2 items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            Ver Videos
          </button>
        </div>

      <!-- Scroll indicator -->
      
    </div>
    <div class="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0">
        <div class="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div class="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
  `,
})
export class HeroComponent implements OnInit {
  private timeline?: gsap.core.Timeline;

  constructor(private elementRef: ElementRef) {
    // Use afterNextRender for client-side only animation
    afterNextRender(() => {
      this.initAnimations();
    });
  }

  ngOnInit() {
    // Component initialized
  }

  private initAnimations() {
    const element = this.elementRef.nativeElement;

    // Create master timeline
    this.timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Animate background blobs
    gsap.to('.blob-1', {
      x: 100,
      y: -100,
      duration: 20,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to('.blob-2', {
      x: -150,
      y: 150,
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to('.blob-3', {
      x: 150,
      y: 100,
      duration: 25,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // Main entrance animation sequence
    this.timeline
      // Logo appears with bounce
      .to('.hero-logo', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
      })
      // 3D text has its own entrance animation, so we skip animating it here
      // Wait 2 seconds for 3D text animation to complete
      .to({}, { duration: 0.5 })
      // Subtitle fades in with slight upward movement
      .to('.hero-subtitle', {
        opacity: 1,
        y: 0,
        duration: 0.8,
      })
      // CTA buttons appear
      .to('.hero-cta', {
        opacity: 1,
        y: 0,
        duration: 0.6,
      }, '-=0.4')
      // Scroll indicator appears
      .to('.scroll-indicator', {
        opacity: 1,
        duration: 0.5,
      }, '-=0.2');

    // Add a subtle floating animation to the logo
    gsap.to('.hero-logo', {
      y: -10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1,
    });

    // Hover effects for CTA buttons
    const ctaButtons = element.querySelectorAll('.cta-button');
    ctaButtons.forEach((button: Element) => {
      button.addEventListener('mouseenter', () => {
        gsap.to(button, {
          scale: 1.05,
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      button.addEventListener('mouseleave', () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        });
      });
    });
  }
}
