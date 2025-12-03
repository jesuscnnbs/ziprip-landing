import {
  Component,
  ElementRef,
  ViewChild,
  afterNextRender,
  signal,
} from '@angular/core';
import { type OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { gsap } from 'gsap';

@Component({
  selector: 'app-ziprip-3d-text',
  standalone: true,
  template: `
    <div class="three-container w-full h-full relative">
      <canvas
        #canvas
        class="w-full h-full block"
        [class.opacity-0]="!isReady()"
        [class.opacity-100]="isReady()"
        [class.transition-opacity]="true"
        [class.duration-1000]="true"
      ></canvas>

      <!-- Loading indicator -->
      @if (!isReady()) {
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-zinc-400 text-xl animate-pulse">...</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .three-container {
      min-height: 450px;
    }

    @media (min-width: 768px) {
      .three-container {
        min-height: 450px;
      }
    }
  `],
})
export class ZipRip3DTextComponent implements OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Three.js core objects
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private textMesh!: THREE.Mesh;
  private animationFrameId?: number;

  // Performance optimization
  private isMobile = false;
  private isLowPerformance = false;

  // Store resize handler for cleanup
  private resizeHandler?: () => void;

  // State
  isReady = signal(false);

  constructor(private elementRef: ElementRef) {
    // Use afterNextRender to ensure this only runs on the client
    afterNextRender(() => {
      this.initThreeJS();
    });
  }

  ngOnDestroy() {
    // Clean up Three.js resources
    this.cleanup();
  }

  // region Init threejs
  private initThreeJS() {
    if (!this.canvasRef?.nativeElement) {
      console.error('Canvas element not found');
      return;
    }

    // Detect mobile and performance capabilities
    this.detectDeviceCapabilities();

    const canvas = this.canvasRef.nativeElement;
    const container = this.elementRef.nativeElement.querySelector('.three-container');

    // Get container dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = null // Transparent background

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      width / height, // Aspect ratio
      0.1, // Near clipping plane
      10 // Far clipping plane
    );
    this.camera.position.z = 6; // Distance from text (higher = further away)

    // Renderer setup with performance optimizations
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true, // Enable transparency
      antialias: !this.isLowPerformance, // Disable antialiasing on low-perf devices
      powerPreference: this.isLowPerformance ? 'low-power' : 'high-performance',
    });
    this.renderer.setSize(width, height);

    // Limit pixel ratio on mobile devices to improve performance
    const maxPixelRatio = this.isMobile ? 1.5 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));

    // Only enable shadows on high-performance devices
    if (!this.isLowPerformance) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Handle window resize
    this.resizeHandler = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);

    // Start the animation loop
    this.animate();

    // Set up lighting system
    this.setupLighting();

    // Load font and create 3D text
    this.createText3D();

    console.log('Three.js initialized successfully');
  }
  //endregion

  //region device detection
  private detectDeviceCapabilities() {
    // Guard against SSR - only run in browser
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      // Default to low performance during SSR
      this.isMobile = true;
      this.isLowPerformance = true;
      return;
    }

    // Detect mobile devices
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768;

    // Detect low performance devices (rough heuristic)
    // Check for hardware concurrency (CPU cores) and memory if available
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 4;

    this.isLowPerformance = cores < 4 || memory < 4 || this.isMobile;

    console.log('Device capabilities:', {
      isMobile: this.isMobile,
      isLowPerformance: this.isLowPerformance,
      cores,
      memory,
    });
  }
  // endregion

  // region Lighting
  private setupLighting() {
    // 1. Ambient Light - Provides base illumination to all objects
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // 2. Main Directional Light - Acts like the sun
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(-5, 5, 2);

    // Only enable shadows on high-performance devices
    if (!this.isLowPerformance) {
      directionalLight.castShadow = true;
      // Configure shadow properties for better quality
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
    }

    this.scene.add(directionalLight);

    // 3. Fill Light (from opposite side) - Softens shadows
    const fillLight = new THREE.DirectionalLight(0xE6AFF5, 0.1);
    fillLight.position.set(-5, 0, -5);
    this.scene.add(fillLight);

    // Only add extra lights on high-performance devices
    if (!this.isLowPerformance) {
      // 4. Top Light - Adds dramatic lighting from above
      const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
      topLight.position.set(0, 10, 0);
      this.scene.add(topLight); 
    }

    // 6. Hemisphere Light - Simulates sky and ground lighting with environment colors
    const hemisphereLight = new THREE.HemisphereLight(
      0x9A76A6, // Sky color (púrpura) - matches environment top
      0x82a676, // Ground color (verde) - matches environment bottom
      0.8
    );
    this.scene.add(hemisphereLight);

    console.log('Lighting system initialized (performance mode:', this.isLowPerformance ? 'low' : 'high', ')');
  }
  // endregion

  // region Environment Map
  private createEnvironmentMap(): THREE.CubeTexture {
    // Create a simple environment map with gradient colors

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Create gradient for each face of the cube
    const createGradientTexture = (topColor: string, bottomColor: string) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, topColor); // Top
      gradient.addColorStop(1, bottomColor); // Bottom

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      return canvas.toDataURL();
    };

    // Colors for environment reflection
    const topColor = '#9A76A6'; // Rosa/púrpura arriba
    const bottomColor = '#000000'; // Verde abajo

    // Create 6 faces for the cube map (all with same gradient)
    const urls = [
      createGradientTexture(topColor, bottomColor), // positive x
      createGradientTexture(topColor, bottomColor), // negative x
      createGradientTexture(topColor, topColor), // positive y (top)
      createGradientTexture(bottomColor, bottomColor), // negative y (bottom)
      createGradientTexture(topColor, bottomColor), // positive z
      createGradientTexture(topColor, bottomColor), // negative z
    ];

    // Load the cube texture
    const loader = new THREE.CubeTextureLoader();
    const cubeTexture = loader.load(urls);

    return cubeTexture;
  }
  //endregion
  // region 3D Text Creation
  private createText3D() {
    const fontLoader = new FontLoader();

    // Load Gabriela font (Google Font converted to typeface.json)
    const fontUrl = '/fonts/Gabriela/Gabriela_Regular.json';

    fontLoader.load(
      fontUrl,
      (font) => {
        // Adjust text geometry settings based on device performance
        const textSize = this.isMobile ? 0.8 : 1.2;
        const curveSegments = this.isLowPerformance ? 6 : 12;
        const bevelSegments = this.isLowPerformance ? 3 : 5;

        // Create text geometry
        const textGeometry = new TextGeometry('ZipRip', {
          font: font,
          size: textSize, // Text size (smaller on mobile)
          depth: 0.3, // How deep/thick the text is (3D depth)
          curveSegments: curveSegments, // Number of points on the curves (fewer on low-perf)
          bevelEnabled: true, // Enable bevel for rounded edges
          bevelThickness: 0.02, // Bevel thickness
          bevelSize: 0.05, // Bevel size
          bevelOffset: 0,
          bevelSegments: bevelSegments, // Smoothness of the bevel (fewer on low-perf)
        });

        // Center the text geometry
        textGeometry.center();

        // Create environment map with custom colors
        const envMap = this.createEnvironmentMap();

        // Create advanced material with physical properties
        // Using MeshPhysicalMaterial for realistic rendering
        const material = new THREE.MeshPhysicalMaterial({
          // Base color (silver metallic)
          color: 0xaaaaaa,

          // Metalness: 1 = full metal for reflections
          metalness: 1,

          // Roughness: 0.2 = mostly smooth with slight texture
          roughness: 0.2,

          // Clearcoat adds a glossy layer on top (like car paint)
          clearcoat: 0.5,
          clearcoatRoughness: 0.1,

          // Reflectivity enhances the material's reflection
          reflectivity: 1.0,

          // Environment map for colored reflections
          envMap: envMap,
          envMapIntensity: 2.5,
        });

        // Create mesh and add to scene
        this.textMesh = new THREE.Mesh(textGeometry, material);
        this.textMesh.castShadow = true;
        this.textMesh.receiveShadow = true;

        this.scene.add(this.textMesh);

        // Animate text entrance with GSAP
        this.animateTextEntrance();

        // Mark as ready
        this.isReady.set(true);

        console.log('3D text created successfully');
      },
      (progress) => {
        console.log('Font loading progress:', (progress.loaded / progress.total) * 100 + '%');
      },
      (error) => {
        console.error('Error loading font:', error);
      }
    );
  }
  //endregion
  //region Intro animation
  private animateTextEntrance() {
    if (!this.textMesh) return;

    // Set initial state for main text (invisible, scaled down)
    this.textMesh.scale.set(0, 0, 0);
    if (this.textMesh.material && 'opacity' in this.textMesh.material) {
      this.textMesh.material.transparent = true;
      this.textMesh.material.opacity = 0;
    }

    // Simple scale up animation
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    timeline
      // Fade in and scale up simultaneously (main text)
      .to(this.textMesh.scale, {
        x: 1.6,
        y: 1.6,
        z: 1.6,
        duration: 1.2,
        ease: 'expo.out',
      })
      .to(
        this.textMesh.material,
        {
          opacity: 1,
          duration: 0.8,
        },
        '<' // Start at the same time as scale
      )
      .to(
        this.textMesh.rotation,
        {
          x: -0.4,
          z: Math.PI * 2,
          duration: 1.2,
        },
        '<' // Start at the same time as scale
      );
  }
  //endregion
  // region Resize
  private onWindowResize() {
    if (!this.renderer || !this.camera) return;

    const container = this.elementRef.nativeElement.querySelector('.three-container');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 300;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // endregion
  // region Animation loop
  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Render the scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private cleanup() {
    // Cancel animation frame (only in browser)
    if (typeof window !== 'undefined' && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Remove event listeners (only in browser)
    if (typeof window !== 'undefined') {
      const canvas = this.canvasRef?.nativeElement;

      // Remove window event listeners
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
    }

    // Dispose of Three.js objects
    if (this.textMesh) {
      this.textMesh.geometry?.dispose();
      if (this.textMesh.material) {
        if (Array.isArray(this.textMesh.material)) {
          this.textMesh.material.forEach(mat => mat.dispose());
        } else {
          this.textMesh.material.dispose();
        }
      }
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
