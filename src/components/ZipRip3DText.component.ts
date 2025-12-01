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
          <div class="text-white text-xl animate-pulse">Loading 3D Text...</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .three-container {
      min-height: 300px;
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

  // Drag-based rotation tracking
  private isDragging = false;
  private previousMouseX = 0;
  private previousMouseY = 0;
  private targetRotationX = 0;
  private targetRotationY = 0;

  // Store bound event handlers for proper cleanup
  private resizeHandler?: () => void;
  private mouseDownHandler?: (event: MouseEvent) => void;
  private mouseMoveHandler?: (event: MouseEvent) => void;
  private mouseUpHandler?: () => void;
  private touchStartHandler?: (event: TouchEvent) => void;
  private touchMoveHandler?: (event: TouchEvent) => void;
  private touchEndHandler?: () => void;

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
    const height = container.clientHeight || 300;

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
    this.camera.position.z = 5;

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

    // Set up mouse/touch tracking for interactive rotation
    this.setupInteractiveControls();

    // Start the animation loop
    this.animate();

    // Set up lighting system
    this.setupLighting();

    // Load font and create 3D text
    this.createText3D();

    console.log('Three.js initialized successfully');
  }

  private setupInteractiveControls() {
    const canvas = this.canvasRef.nativeElement;

    // Mouse down - Start dragging
    this.mouseDownHandler = (event: MouseEvent) => {
      this.isDragging = true;
      this.previousMouseX = event.clientX;
      this.previousMouseY = event.clientY;
      canvas.style.cursor = 'grabbing';
    };

    // Mouse move - Rotate while dragging
    this.mouseMoveHandler = (event: MouseEvent) => {
      if (!this.isDragging) {
        canvas.style.cursor = 'grab';
        return;
      }

      // Calculate delta (how much the mouse moved)
      const deltaX = event.clientX - this.previousMouseX;
      const deltaY = event.clientY - this.previousMouseY;

      // Update target rotation based on delta
      // Sensitivity factor controls how fast it rotates
      const sensitivity = 0.005;
      this.targetRotationY += deltaX * sensitivity;
      this.targetRotationX += deltaY * sensitivity;

      // Clamp rotations to limit range
      // X rotation (vertical tilt): ±60 degrees
      this.targetRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.targetRotationX));

      // Y rotation (horizontal spin): ±90 degrees
      this.targetRotationY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotationY));

      // Update previous position
      this.previousMouseX = event.clientX;
      this.previousMouseY = event.clientY;
    };

    // Mouse up - Stop dragging
    this.mouseUpHandler = () => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
    };

    // Touch start - Start dragging on mobile
    this.touchStartHandler = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        this.isDragging = true;
        const touch = event.touches[0];
        this.previousMouseX = touch.clientX;
        this.previousMouseY = touch.clientY;
      }
    };

    // Touch move - Rotate while dragging on mobile
    this.touchMoveHandler = (event: TouchEvent) => {
      if (!this.isDragging || event.touches.length === 0) return;

      const touch = event.touches[0];

      // Calculate delta
      const deltaX = touch.clientX - this.previousMouseX;
      const deltaY = touch.clientY - this.previousMouseY;

      // Update target rotation
      const sensitivity = 0.005;
      this.targetRotationY += deltaX * sensitivity;
      this.targetRotationX += deltaY * sensitivity;

      // Clamp X rotation
      this.targetRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.targetRotationX));

      // Update previous position
      this.previousMouseX = touch.clientX;
      this.previousMouseY = touch.clientY;
    };

    // Touch end - Stop dragging on mobile
    this.touchEndHandler = () => {
      this.isDragging = false;
    };

    // Add event listeners
    canvas.addEventListener('mousedown', this.mouseDownHandler);
    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);

    canvas.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    window.addEventListener('touchmove', this.touchMoveHandler, { passive: true });
    window.addEventListener('touchend', this.touchEndHandler);

    // Set initial cursor
    canvas.style.cursor = 'grab';

    console.log('Interactive drag controls initialized');
  }

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

  private setupLighting() {
    // 1. Ambient Light - Provides base illumination to all objects
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // 2. Main Directional Light - Acts like the sun
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(5, 5, 5);

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

      // 5. Point Lights - Create highlights and shimmer effects
      // Front-left point light (warm)
      /*const pointLight1 = new THREE.PointLight(0xffd700, 2, 10);
      pointLight1.position.set(-3, 2, 3);
      this.scene.add(pointLight1);

      // Front-right point light (cool)
      const pointLight2 = new THREE.PointLight(0x00ffff, 2, 10);
      pointLight2.position.set(3, 2, 3);
      this.scene.add(pointLight2);

      // Back light for rim lighting effect
      const rimLight = new THREE.PointLight(0xffffff, 1.5, 10);
      rimLight.position.set(0, 0, -5);
      this.scene.add(rimLight);*/
    }

    // 6. Hemisphere Light - Simulates sky and ground lighting
    const hemisphereLight = new THREE.HemisphereLight(
      0xffffbb, // Sky color (warm white)
      0x080820, // Ground color (dark blue)
      0.6
    );
    this.scene.add(hemisphereLight);

    console.log('Lighting system initialized (performance mode:', this.isLowPerformance ? 'low' : 'high', ')');
  }

  private createText3D() {
    const fontLoader = new FontLoader();

    // Load font from CDN (Helvetiker font is commonly used with Three.js)
    // You can also use local fonts by placing them in /public/fonts/
    const fontUrl = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';

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
          bevelThickness: 0.09, // Bevel thickness
          bevelSize: 0.05, // Bevel size
          bevelOffset: 0.01,
          bevelSegments: bevelSegments, // Smoothness of the bevel (fewer on low-perf)
        });

        // Center the text geometry
        textGeometry.center();

        // Create advanced material with physical properties
        // Using MeshPhysicalMaterial for realistic rendering
        const material = new THREE.MeshPhysicalMaterial({
          // Base color (white/silver)
          color: 0xffffff,

          // Metalness: 0 = dielectric (plastic), 1 = full metal
          metalness: 0.7,

          // Roughness: 0 = smooth/reflective, 1 = rough/diffuse
          roughness: 0.1,

          // Clearcoat adds a glossy layer on top (like car paint)
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,

          // Reflectivity enhances the material's reflection
          reflectivity: 1.0,

          // Emissive makes the material glow
          emissive: 0x555555, // Slight glow
          emissiveIntensity: 1,

          // Environment mapping (will be enhanced by lighting)
          envMapIntensity: 3.5,

          // Enable transmission for glass-like effects (optional)
           transmission: 0.1,
           thickness: 0.5,
        });

        // Optional: Load texture maps for even more realism
        // Uncomment and add texture files to /public/textures/ to use
        
        const textureLoader = new THREE.TextureLoader();

        // Normal map adds surface detail
        material.normalMap = textureLoader.load('/textures/normal.jpg');
        material.normalScale = new THREE.Vector2(0.5, 0.5);

        // Roughness map controls shine variation
        material.roughnessMap = textureLoader.load('/textures/roughness.jpg');

        // Metallic map controls metallic variation
        material.metalnessMap = textureLoader.load('/textures/metallic.jpg');

        // Environment map for reflections
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        material.envMap = cubeTextureLoader.load([
          '/textures/px.jpg', '/textures/nx.jpg',
          '/textures/py.jpg', '/textures/ny.jpg',
          '/textures/pz.jpg', '/textures/nz.jpg'
        ]);
        

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

  private animateTextEntrance() {
    if (!this.textMesh) return;

    // Set initial state (invisible, scaled down, positioned back)
    this.textMesh.scale.set(0.1, 0.1, 0.1);
    this.textMesh.position.z = -10;

    if (this.textMesh.material && 'opacity' in this.textMesh.material) {
      this.textMesh.material.transparent = true;
      this.textMesh.material.opacity = 0;
    }

    // Create GSAP timeline for entrance animation
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    timeline
      // Scale up
      .to(this.textMesh.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.5,
        ease: 'elastic.out(1, 0.5)',
      })
      // Move forward
      .to(
        this.textMesh.position,
        {
          z: 0.5,
          duration: 1.5,
        },
        '<' // Start at the same time as scale
      )
      // Fade in
      .to(
        this.textMesh.material,
        {
          opacity: 1,
          duration: 1,
        },
        '<0.3' // Start slightly after scale
      )
      // Add a little bounce rotation
      .to(
        this.textMesh.rotation,
        {
          y: Math.PI / 18,
          x: Math.PI / 18,
          z: Math.PI * 2,
          duration: 0.5,
          ease: 'powe2.out',
        },
        '<'
      );
  }

  private onWindowResize() {
    if (!this.renderer || !this.camera) return;

    const container = this.elementRef.nativeElement.querySelector('.three-container');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 300;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Animate the text mesh if it exists
    if (this.textMesh) {
      // Smooth interpolation (lerp) to follow cursor/finger
      // This creates a smooth "lag" effect as the text follows the target rotation
      const lerpFactor = 0.04; // Lower = smoother/slower, Higher = snappier/faster

      // Interpolate rotation towards target
      this.textMesh.rotation.y += (this.targetRotationY - this.textMesh.rotation.y) * lerpFactor;
      this.textMesh.rotation.x += (this.targetRotationX - this.textMesh.rotation.x) * lerpFactor;

      // Only add floating effect on high-performance devices
      if (!this.isLowPerformance) {
        // Subtle floating effect (up and down)
        this.textMesh.position.y = Math.sin(Date.now() * 0.001) * 0.1;
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
      if (this.mouseMoveHandler) {
        window.removeEventListener('mousemove', this.mouseMoveHandler);
      }
      if (this.mouseUpHandler) {
        window.removeEventListener('mouseup', this.mouseUpHandler);
      }
      if (this.touchMoveHandler) {
        window.removeEventListener('touchmove', this.touchMoveHandler);
      }
      if (this.touchEndHandler) {
        window.removeEventListener('touchend', this.touchEndHandler);
      }

      // Remove canvas event listeners
      if (canvas) {
        if (this.mouseDownHandler) {
          canvas.removeEventListener('mousedown', this.mouseDownHandler);
        }
        if (this.touchStartHandler) {
          canvas.removeEventListener('touchstart', this.touchStartHandler);
        }
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
