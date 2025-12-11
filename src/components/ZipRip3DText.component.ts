import {
  Component,
  ElementRef,
  ViewChild,
  afterNextRender,
  signal,
  input,
  effect,
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
        class="w-full h-full block canvas-background"
        [class.opacity-0]="!isReady()"
        [class.opacity-100]="isReady()"
        [class.transition-opacity]="true"
        [class.duration-1000]="true"
      ></canvas>

      <!-- Loading indicator -->
      @if (!isReady()) {
        <div class="absolute inset-0 flex items-center justify-center z-10">
          <div class="text-zinc-400 text-xl animate-pulse">...</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .three-container {
      min-height: 800px;
      position: relative;
    }

    .canvas-background {
      position: relative;
      z-index: 0;
      pointer-events: none;
    }

    @media (min-width: 768px) {
      .three-container {
        min-height: 800px;
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
  private backgroundCoin!: THREE.Mesh;
  private animationFrameId?: number;

  // Coin rotation
  private coinRotationSpeed = 0.01;
  private previousRotation = { x: 0, y: 0, z: 0 };

  // Performance optimization
  private isMobile = false;
  private isLowPerformance = false;

  // Store resize handler for cleanup
  private resizeHandler?: () => void;
  private scrollHandler?: () => void;

  // State
  isReady = signal(false);

  // Input for external rotation control
  rotation = input<{ x: number; y: number; z: number } | null>(null);

  constructor(private elementRef: ElementRef) {
    // Set up effect to watch rotation changes
    effect(() => {
      const rot = this.rotation();
      if (rot && this.textMesh) {
        // Calculate rotation delta to determine text movement speed
        const deltaX = Math.abs(rot.x - this.previousRotation.x);
        const deltaY = Math.abs(rot.y - this.previousRotation.y);
        const deltaZ = Math.abs(rot.z - this.previousRotation.z);
        const totalDelta = deltaX + deltaY + deltaZ;

        // Add to coin rotation speed based on text movement (accelerate)
        // Reduced multiplier for more subtle acceleration
        this.coinRotationSpeed += totalDelta * 0.1;

        // Apply rotation to text
        this.textMesh.rotation.x = rot.x;
        this.textMesh.rotation.y = rot.y;
        this.textMesh.rotation.z = rot.z;

        // Update previous rotation
        this.previousRotation = { ...rot };
      }
    });
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
      100, // Field of view
      width / height, // Aspect ratio
      0.1, // Near clipping plane
      25 // Far clipping plane
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

    // Handle scroll for camera movement
    this.scrollHandler = this.onScroll.bind(this);
    window.addEventListener('scroll', this.scrollHandler, { passive: true });

    // Start the animation loop
    this.animate();

    // Set up lighting system
    this.setupLighting();

    // Create background coin for refraction
    this.createBackgroundCoin();

    // Load font and create 3D text
    this.createText3D();

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    // 2. Main Directional Light - Acts like the sun
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(-5, 5, 5);

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

    // Light specifically for the background coin
    const backLight = new THREE.PointLight(0xffffff, 2.0);
    const backLight2 = new THREE.PointLight(0xffffff, 2.0);
    backLight.position.set(0, 0, -10);
    backLight2.position.set(0, -10, -10);
    this.scene.add(backLight);

    // Only add extra lights on high-performance devices
    if (!this.isLowPerformance) {
      // 4. Top Light - Adds dramatic lighting from above
      const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
      topLight.position.set(0, 10, 0);
      this.scene.add(topLight);
    }

    // 6. Hemisphere Light - Simulates sky and ground lighting with environment colors
    const hemisphereLight = new THREE.HemisphereLight(
      0xAA46B6, // Sky color (púrpura) - matches environment top
      0x82a676, // Ground color (verde) - matches environment bottom
      1
    );
    this.scene.add(hemisphereLight);

    console.log('Lighting system initialized (performance mode:', this.isLowPerformance ? 'low' : 'high', ')');
  }
  // endregion

  // region Background Coin
  private createBackgroundCoin() {
    // Create a coin-shaped cylinder (large radius, small height)
    const coinRadius = 8;
    const coinHeight = 1;
    const coinGeometry = new THREE.CylinderGeometry(
      coinRadius,  // radiusTop
      coinRadius,  // radiusBottom
      coinHeight,  // height
      64           // radialSegments for smooth circle
    );

    // Rotate geometry so coin faces camera (cylinder is vertical by default)
    coinGeometry.rotateX(Math.PI / 2);

    // Load the ziprip.png image as texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/head-ziprip.png',
      (texture) => {
        // Rotate texture to correct orientation (fix horizontal issue)
        texture.center.set(0.5, 0.5);
        texture.rotation = Math.PI / 2; // Rotate 90 degrees clockwise

        // Create materials array for different faces
        // Cylinder has 3 material slots: [side, top, bottom]
        const sideMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff, // Grey edge
          metalness: 1,
          roughness: 0.2,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });

        const faceMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: texture,
          transparent: false,
          side: THREE.DoubleSide,
        });

        const materials = [
          sideMaterial,  // Side of coin
          faceMaterial,  // Top face (with image)
          faceMaterial,  // Bottom face (with image)
        ];

        this.backgroundCoin = new THREE.Mesh(coinGeometry, materials);

        // Position the coin behind the text
        this.backgroundCoin.position.y = 3;
        this.backgroundCoin.position.z = -12;

        this.scene.add(this.backgroundCoin);

        console.log('Background coin created with ziprip.png for refraction');
      },
      (progress) => {
        console.log('Background image loading:', (progress.loaded / progress.total) * 100 + '%');
      },
      (error) => {
        console.error('Error loading background image:', error);
        // Fallback to solid color if image fails to load
        const fallbackMaterial = new THREE.MeshStandardMaterial({
          color: 0x9A76A6,
          side: THREE.DoubleSide,
        });

        this.backgroundCoin = new THREE.Mesh(coinGeometry, fallbackMaterial);
        this.backgroundCoin.position.z = -4;
        this.scene.add(this.backgroundCoin);
      }
    );
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
    const topColor = '#999999'; // Rosa/púrpura arriba
    const bottomColor = '#333333'; // Verde abajo

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
  // region Noise Texture Generation
  private smoothNoise(x: number, y: number, seed: number): number {
    // Simple smooth noise function
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  private interpolate(a: number, b: number, t: number): number {
    // Smoothstep interpolation
    const t2 = t * t * (3.0 - 2.0 * t);
    return a * (1.0 - t2) + b * t2;
  }

  private perlinNoise(x: number, y: number, seed: number): number {
    // Get integer coordinates
    const xi = Math.floor(x);
    const yi = Math.floor(y);

    // Get fractional part
    const xf = x - xi;
    const yf = y - yi;

    // Get noise values at corners
    const n00 = this.smoothNoise(xi, yi, seed);
    const n10 = this.smoothNoise(xi + 1, yi, seed);
    const n01 = this.smoothNoise(xi, yi + 1, seed);
    const n11 = this.smoothNoise(xi + 1, yi + 1, seed);

    // Interpolate
    const nx0 = this.interpolate(n00, n10, xf);
    const nx1 = this.interpolate(n01, n11, xf);

    return this.interpolate(nx0, nx1, yf);
  }

  private fbm(x: number, y: number, octaves: number): number {
    // Fractal Brownian Motion
    let value = 0.0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxValue = 0.0;

    for (let i = 0; i < octaves; i++) {
      value += this.perlinNoise(x * frequency, y * frequency, i * 100) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value / maxValue;
  }

  private createNoiseTexture(): THREE.DataTexture {
    // Create a procedural noise texture with Fractal Brownian Motion
    const size = 512;
    const data = new Uint8Array(size * size * 4);

    for (let i = 0; i < size * size; i++) {
      const stride = i * 4;

      const x = (i % size) / size * 20; // Scale up for smaller, more detailed clouds
      const y = Math.floor(i / size) / size * 20;

      // Generate FBM noise
      const noise = this.fbm(x, y, 6); // 6 octaves for smooth organic patterns

      // Add some turbulence for more interesting patterns
      const turbulence = Math.abs(
        Math.sin(noise * 8) * 0.3 +
        Math.cos(noise * 4) * 0.2
      );

      // Combine and map to 0-255
      let value = (noise + turbulence * 0.5) * 255;
      value = Math.max(0, Math.min(255, value)); // Clamp

      data[stride] = value;     // R
      data[stride + 1] = value; // G
      data[stride + 2] = value; // B
      data[stride + 3] = value; // A
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
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
          bevelSize: 0.035, // Bevel size
          bevelOffset: 0,
          bevelSegments: bevelSegments, // Smoothness of the bevel (fewer on low-perf)
        });

        // Center the text geometry
        textGeometry.center();

        // Create environment map with custom colors
        const envMap = this.createEnvironmentMap();

        // Create noise texture for surface detail (not transparency)
        const noiseTexture = this.createNoiseTexture();

        // Create advanced material with physical properties
        // Using MeshPhysicalMaterial for realistic rendering
        const material = new THREE.MeshPhysicalMaterial({
          // Base color - slightly tinted for better visibility
          color: 0xddddff, // Slight blue tint

          // Reduce metalness for more glass-like appearance but not too much
          metalness: 0.7,

          // Add surface texture variation with noise
          roughness: 0.15,
          roughnessMap: noiseTexture, // Use noise for surface detail instead of transparency

          // Clearcoat adds a glossy layer on top
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,

          // Reflectivity enhances the material's reflection
          reflectivity: 1.0,

          // Environment map for colored reflections
          envMap: envMap,
          envMapIntensity: 2.0,

          // Transparency - MUST be true for transmission to work
          transparent: true,
          opacity: 0.4, // Fully opaque base
          // NO alphaMap - this was causing visibility issues

          // Reduced glass-like refraction for better text visibility
          transmission: 0.3, // Reduced transmission so text is more solid
          thickness: 0.5, // Reduced thickness
          ior: 1.8, // Moderate index of refraction

          // Additional physical properties for better refraction
          attenuationDistance: 1.0,
          attenuationColor: 0xffffff,
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
      )
      .to(
        this.textMesh.position,
        {
          y: 1,
          duration: 1.2,
          ease: 'expo.out',
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
  // region Scroll
  private onScroll() {
    if (!this.camera) return;

    // Get the container element
    const container = this.elementRef.nativeElement.querySelector('.three-container');
    if (!container) return;

    // Get the Hero element (parent of this component)
    const heroElement = container.closest('.hero-3d-text')?.parentElement;
    if (!heroElement) return;

    // Get Hero's bounding rect
    const heroRect = heroElement.getBoundingClientRect();
    const heroTop = heroRect.top;
    const heroHeight = heroRect.height;

    // Calculate how much of the Hero has scrolled past the top of viewport
    // When Hero top is at viewport top: scrolled = 0
    // When Hero bottom is at viewport top: scrolled = heroHeight
    const scrolledPastTop = -heroTop;

    // Calculate scroll percentage within the Hero element (0 to 1)
    // 0 = Hero just entering viewport from bottom
    // 1 = Hero completely scrolled past viewport top
    const scrollPercent = Math.max(0, Math.min(1, scrolledPastTop / heroHeight));

    // Update camera position based on scroll within Hero
    // Move camera on Y axis (up/down) as Hero scrolls
    this.camera.position.y = - scrollPercent * 2; // Adjust multiplier for sensitivity

    // Tilt camera slightly as Hero scrolls
    this.camera.rotation.x = - scrollPercent * 0.5;
  }

  // endregion
  // region Animation loop
  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Rotate the coin on Y axis
    if (this.backgroundCoin) {
      this.backgroundCoin.rotation.y += this.coinRotationSpeed;

      // Decay coin rotation speed back to default value (deceleration effect)
      const baseSpeed = 0.01;
      const decayFactor = 0.95; // How quickly it slows down (lower = faster decay)

      // Lerp toward base speed
      this.coinRotationSpeed = this.coinRotationSpeed * decayFactor + baseSpeed * (1 - decayFactor);

      // Clamp to minimum base speed
      if (Math.abs(this.coinRotationSpeed - baseSpeed) < 0.001) {
        this.coinRotationSpeed = baseSpeed;
      }
    }

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

      if (this.scrollHandler) {
        window.removeEventListener('scroll', this.scrollHandler);
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

    if (this.backgroundCoin) {
      this.backgroundCoin.geometry?.dispose();
      if (this.backgroundCoin.material) {
        if (Array.isArray(this.backgroundCoin.material)) {
          this.backgroundCoin.material.forEach(mat => mat.dispose());
        } else {
          this.backgroundCoin.material.dispose();
        }
      }
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
