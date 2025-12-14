import {
  Component,
  ElementRef,
  ViewChild,
  afterNextRender,
  signal,
  output,
} from '@angular/core';
import { type OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { gsap } from 'gsap';

export interface RotationState {
  x: number;
  y: number;
  z: number;
}

@Component({
  selector: 'app-axis-control-sphere',
  standalone: true,
  template: `
    <div class="axis-control-wrapper">
      <!-- Floating toggle button -->
      <button
        #toggleButton
        class="axis-toggle-button"
        (click)="toggleOpen()"
        [attr.aria-label]="isOpen() ? 'Close axis control' : 'Open axis control'"
        type="button"
      >
        @if (!isOpen()) {
          <!-- Closed state icon -->
          <svg class="axis-toggle-icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <g>
              <path style="fill:#AFAFAF;" d="M318.828,496.271L104.988,377.47L319.03,250.628c3.995-2.359,5.305-7.521,2.946-11.499
                  c-2.35-3.987-7.495-5.305-11.499-2.946L96.519,362.974v-253.86c0-4.642-3.752-8.393-8.393-8.393c-4.642,0-8.393,3.752-8.393,8.393
                  v268.59c0,2.921,1.519,5.615,3.987,7.143c0.008,0.008,0.008,0.008,0.017,0.008c0,0.008,0.008,0.008,0.017,0.017l0.017,0.008
                  c0,0,0.008,0,0.008,0.008c0.008,0,0.017,0.008,0.017,0.008c0.008,0,0.008,0.008,0.017,0.008s0.008,0.008,0.017,0.008
                  c0.008,0.008,0.008,0.008,0.017,0.008c0,0.008,0.008,0.008,0.008,0.008c0.008,0,0.008,0,0.008,0c0,0.008,0.008,0.008,0.008,0.008
                  s0.008,0,0.008,0.008h0.008c0,0,0,0.008,0.008,0.008h0.008c0,0.008,0,0.008,0,0.008c0.008,0,0.008,0,0.017,0.008
                  c0.008,0,0.008,0,0.017,0.008c0.008,0,0.008,0,0.017,0.008c0.008,0,0.008,0.008,0.008,0.008c0.008,0,0.008,0,0.008,0
                  c0.008,0,0.008,0.008,0.008,0.008c0.008,0,0.008,0,0.008,0l0.008,0.008h0.008l0.008,0.008c0.008,0,0.008,0.008,0.017,0.008
                  c0,0,0.008,0.008,0.017,0.008c0,0,0.008,0.008,0.017,0.008l226.623,125.902c1.276,0.714,2.677,1.049,4.054,1.049
                  c2.954,0,5.808-1.561,7.344-4.323c0.722-1.284,1.058-2.686,1.058-4.062C323.142,500.66,321.59,497.807,318.828,496.271z"/>
              <path style="fill:#AFAFAF;" d="M121.7,25.18h63.673l-69.607,69.607c-2.401,2.401-3.122,6.01-1.821,9.149
                  c1.301,3.139,4.365,5.179,7.756,5.179h83.934c4.642,0,8.393-3.752,8.393-8.393s-3.752-8.393-8.393-8.393h-63.673l69.607-69.607
                  c2.401-2.401,3.122-6.01,1.821-9.149c-1.293-3.139-4.365-5.179-7.756-5.179H121.7c-4.642,0-8.393,3.752-8.393,8.393
                  S117.058,25.18,121.7,25.18z"/>
              <path style="fill:#AFAFAF;" d="M356.716,171.344v46.886c0,4.642,3.752,8.393,8.393,8.393c4.642,0,8.393-3.752,8.393-8.393v-46.886
                  l39.508-39.508c3.282-3.282,3.282-8.586,0-11.868c-3.282-3.282-8.586-3.282-11.868,0l-36.033,36.033l-36.033-36.033
                  c-3.282-3.282-8.586-3.282-11.868,0c-3.282,3.282-3.282,8.586,0,11.868L356.716,171.344z"/>
              <path style="fill:#AFAFAF;" d="M402.158,461.639l36.033-36.033c3.282-3.282,3.282-8.586,0-11.868s-8.586-3.282-11.868,0
                  l-36.033,36.033l-36.033-36.033c-3.282-3.282-8.586-3.282-11.868,0c-3.282,3.282-3.282,8.586,0,11.868l36.033,36.033
                  l-36.033,36.033c-3.282-3.282-3.282-8.586,0-11.868c1.637,1.637,3.785,2.459,5.934,2.459c2.149,0,4.297-0.823,5.934-2.459
                  l36.033-36.033l36.033,36.033c1.637,1.637,3.785,2.459,5.934,2.459c2.149,0,4.297-0.823,5.934-2.459
                  c3.282-3.282,3.282-8.586,0-11.868L402.158,461.639z"/>
            </g>
            <path d="M113.306,16.787h63.673l-69.607,69.607c-2.401,2.401-3.122,6.01-1.821,9.149c1.301,3.139,4.365,5.179,7.756,5.179h83.934
                c4.642,0,8.393-3.752,8.393-8.393s-3.752-8.393-8.393-8.393h-63.673l69.607-69.607c2.401-2.401,3.122-6.01,1.821-9.149
                C203.704,2.04,200.632,0,197.241,0h-83.934c-4.642,0-8.393,3.752-8.393,8.393S108.665,16.787,113.306,16.787z"/>
            <path d="M348.323,162.95v46.886c0,4.642,3.752,8.393,8.393,8.393c4.642,0,8.393-3.752,8.393-8.393V162.95l39.508-39.508
                c3.282-3.282,3.282-8.586,0-11.868s-8.586-3.282-11.868,0l-36.033,36.033l-36.033-36.033c-3.282-3.282-8.586-3.282-11.868,0
                s-3.282,8.586,0,11.868L348.323,162.95z"/>
            <path d="M393.765,453.246l36.033-36.033c3.282-3.282,3.282-8.586,0-11.868c-3.282-3.282-8.586-3.282-11.868,0l-36.033,36.033
                l-36.033-36.033c-3.282-3.282-8.586-3.282-11.868,0c-3.282,3.282-3.282,8.586,0,11.868l36.033,36.033l-36.033,36.033
                c-3.282-3.282-3.282-8.586,0-11.868c1.637,1.637,3.785,2.459,5.934,2.459s4.297-0.823,5.934-2.459l36.033-36.033l36.033,36.033
                c1.637,1.637,3.785,2.459,5.934,2.459c2.149,0,4.297-0.823,5.934-2.459c3.282-3.282,3.282-8.586,0-11.868L393.765,453.246z"/>
            <path d="M310.426,487.877l-139.004-77.228c5.884-13.01,9.031-26.859,9.031-41.338c0-15.746-3.735-30.603-10.206-43.889
                l140.389-83.187c3.995-2.359,5.305-7.521,2.946-11.499c-2.35-3.987-7.495-5.305-11.499-2.946l-140.38,83.187
                c-16.745-23.468-43.243-39.449-73.569-41.967V100.721c0-4.642-3.752-8.393-8.393-8.393c-4.642,0-8.393,3.752-8.393,8.393v268.59
                c0,2.921,1.519,5.615,3.987,7.143c0.008,0.008,0.008,0.008,0.017,0.008c0,0.008,0.008,0.008,0.017,0.017l0.017,0.008
                c0,0,0.008,0,0.008,0.008c0.008,0,0.017,0.008,0.017,0.008c0.008,0,0.008,0.008,0.017,0.008s0.008,0.008,0.017,0.008
                c0.008,0.008,0.008,0.008,0.017,0.008c0,0.008,0.008,0.008,0.008,0.008c0.008,0,0.008,0,0.008,0c0,0.008,0.008,0.008,0.008,0.008
                s0.008,0,0.008,0.008h0.008c0,0,0,0.008,0.008,0.008h0.008c0,0.008,0,0.008,0,0.008c0.008,0,0.008,0,0.017,0.008
                c0.008,0,0.008,0,0.017,0.008c0.008,0,0.008,0,0.017,0.008c0.008,0,0.008,0.008,0.008,0.008c0.008,0,0.008,0,0.008,0
                c0.008,0,0.008,0.008,0.008,0.008c0.008,0,0.008,0,0.008,0l0.008,0.008h0.008l0.008,0.008c0.008,0,0.008,0.008,0.017,0.008
                c0,0,0.008,0.008,0.017,0.008l0.017,0.008l226.623,125.902c1.267,0.714,2.669,1.049,4.046,1.049c2.954,0,5.808-1.561,7.344-4.323
                c0.722-1.284,1.058-2.686,1.058-4.062C314.749,492.267,313.188,489.413,310.426,487.877z M88.126,285.805
                c24.198,2.417,45.333,15.201,59.065,33.775l-59.065,35.001V285.805z M155.777,334.009c5.011,10.744,7.89,22.679,7.89,35.303
                c0,11.591-2.426,22.696-6.958,33.162l-60.114-33.397L155.777,334.009z"/>
          </svg>
        } @else {
          <!-- Open state icon (empty for now) -->
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="axis-toggle-icon size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
        }
      </button>

      <!-- Axis control container -->
      <div #controlContainer class="axis-control-container relative" [class.visible]="isOpen()">
        <canvas
          #canvas
          class="w-full h-full block cursor-grab active:cursor-grabbing"
          [class.opacity-0]="!isReady()"
          [class.opacity-100]="isReady()"
          [class.transition-opacity]="true"
          [class.duration-500]="true"
        ></canvas>

        <!-- Labels for axes and reset button -->
        @if (isReady()) {
          <div class="absolute top-2 left-2 text-white text-xs font-mono space-y-1">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Eje X</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Eje Y</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Eje Z</span>
            </div>
            <button
              class="reset-button mt-2 px-2 py-1 text-xs"
              (click)="resetRotation()"
              type="button"
              title="Reset rotation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        }

        <!-- Loading indicator -->
        @if (!isReady()) {
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-white text-sm animate-pulse">...</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .axis-control-wrapper {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 1000;
    }

    .axis-toggle-button {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .axis-toggle-button:hover {
      background: rgba(0, 0, 0, 0.85);
      border-color: rgba(255, 255, 255, 0.4);
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }

    .axis-toggle-button:active {
      transform: scale(0.95);
    }

    .axis-toggle-icon {
      width: 32px;
      height: 32px;
      fill: white;
      stroke: white;
    }

    .reset-button {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .reset-button:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
      transform: scale(1.05);
    }

    .reset-button:active {
      transform: scale(0.95);
    }

    .axis-control-container {
      width: 200px;
      height: 200px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
      position: absolute;
      bottom: 80px;
      right: 0;
      opacity: 0;
      transform: scale(0.8) translateY(20px);
      pointer-events: none;
    }

    .axis-control-container.visible {
      pointer-events: auto;
    }
  `],
})
export class AxisControlSphereComponent implements OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('controlContainer', { static: false }) controlContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('toggleButton', { static: false }) toggleButtonRef!: ElementRef<HTMLButtonElement>;

  // Output event for rotation changes
  rotationChange = output<RotationState>();

  // Three.js core objects
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private sphereGroup!: THREE.Group;
  private animationFrameId?: number;

  // Mouse interaction
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private currentRotation = { x: -0.4, y: 0, z: 0 };

  // Event handlers for cleanup
  private mouseDownHandler?: (e: MouseEvent) => void;
  private mouseMoveHandler?: (e: MouseEvent) => void;
  private mouseUpHandler?: () => void;
  private touchStartHandler?: (e: TouchEvent) => void;
  private touchMoveHandler?: (e: TouchEvent) => void;
  private touchEndHandler?: () => void;
  private resizeHandler?: () => void;

  // State
  isReady = signal(false);
  isOpen = signal(false);

  constructor(private elementRef: ElementRef) {
    afterNextRender(() => {
      this.initThreeJS();
    });
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private initThreeJS() {
    if (!this.canvasRef?.nativeElement) {
      console.error('Canvas element not found');
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const container = this.elementRef.nativeElement.querySelector('.axis-control-container');

    const width = container.clientWidth || 200;
    const height = container.clientHeight || 200;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      50,
      width / height,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create the axis sphere
    this.createAxisSphere();

    // Set up lighting
    this.setupLighting();

    // Set up mouse controls
    this.setupMouseControls();

    // Set up touch controls
    this.setupTouchControls();

    // Handle window resize
    this.resizeHandler = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);

    // Start animation loop
    this.animate();

    this.isReady.set(true);

    console.log('AxisControlSphere initialized');
  }

  private createAxisSphere() {
    // Create a group to hold all axis elements
    this.sphereGroup = new THREE.Group();

    // Create central sphere
    const sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.5,
      shininess: 100,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.sphereGroup.add(sphere);

    // Create positive X axis (Red)
    this.createAxis(
      new THREE.Vector3(2, 0, 0),
      0xff0000,
      'X'
    );

    // Create negative X axis (Grey)
    this.createAxis(
      new THREE.Vector3(-2, 0, 0),
      0x666666,
      '-X',
      true
    );

    // Create positive Y axis (Green)
    this.createAxis(
      new THREE.Vector3(0, 2, 0),
      0x00ff00,
      'Y'
    );

    // Create negative Y axis (Grey)
    this.createAxis(
      new THREE.Vector3(0, -2, 0),
      0x666666,
      '-Y',
      true
    );

    // Create positive Z axis (Blue)
    this.createAxis(
      new THREE.Vector3(0, 0, 2),
      0x0000ff,
      'Z'
    );

    // Create negative Z axis (Grey)
    this.createAxis(
      new THREE.Vector3(0, 0, -2),
      0x666666,
      '-Z',
      true
    );

    // Create plane circles
    this.createPlaneCircles();

    // Set initial rotation
    this.sphereGroup.rotation.x = this.currentRotation.x;
    this.sphereGroup.rotation.y = this.currentRotation.y;
    this.sphereGroup.rotation.z = this.currentRotation.z;

    this.scene.add(this.sphereGroup);
  }

  private createAxis(direction: THREE.Vector3, color: number, label: string, isNegative = false) {
    // Create line geometry
    const points = [
      new THREE.Vector3(0, 0, 0),
      direction,
    ];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 3,
      opacity: isNegative ? 0.5 : 1,
      transparent: isNegative,
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.sphereGroup.add(line);

    // Only add arrow head for positive axes
    if (!isNegative) {
      // Create arrow head (cone)
      const coneGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
      const coneMaterial = new THREE.MeshPhongMaterial({ color: color });
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);

      // Position and orient the cone at the end of the axis
      cone.position.copy(direction);

      // Orient the cone to point along the axis
      const axis = direction.clone().normalize();
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
      cone.quaternion.copy(quaternion);

      this.sphereGroup.add(cone);

      // Add a small sphere at the end for better visibility
      const endSphereGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const endSphereMaterial = new THREE.MeshPhongMaterial({ color: color });
      const endSphere = new THREE.Mesh(endSphereGeometry, endSphereMaterial);
      endSphere.position.copy(direction);
      //this.sphereGroup.add(endSphere);
    }
  }

  private createPlaneCircles() {
    const radius = 1.5;
    const segments = 64;

    // XY Plane Circle (perpendicular to Z axis) - Yellow/White
    this.createCircle(radius, segments, 0xffff00, 'xy');

    // XZ Plane Circle (perpendicular to Y axis) - Cyan/White
    this.createCircle(radius, segments, 0x00ffff, 'xz');

    // YZ Plane Circle (perpendicular to X axis) - Magenta/White
    this.createCircle(radius, segments, 0xff00ff, 'yz');
  }

  private createCircle(radius: number, segments: number, color: number, plane: 'xy' | 'xz' | 'yz') {
    const curve = new THREE.EllipseCurve(
      0, 0,            // center x, y
      radius, radius,  // xRadius, yRadius
      0, 2 * Math.PI,  // start angle, end angle
      false,           // clockwise
      0                // rotation
    );

    const points = curve.getPoints(segments);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      linewidth: 1,
    });

    const circle = new THREE.Line(geometry, material);

    // Rotate circle to align with the correct plane
    if (plane === 'xz') {
      // Rotate around X axis to make it horizontal (XZ plane)
      circle.rotation.x = Math.PI / 2;
    } else if (plane === 'yz') {
      // Rotate around Y axis to make it vertical (YZ plane)
      circle.rotation.y = Math.PI / 2;
    }
    // xy plane is already in the correct orientation (default)

    this.sphereGroup.add(circle);
  }

  private setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Add another light from the opposite side
    const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
    backLight.position.set(-5, -5, -5);
    this.scene.add(backLight);
  }

  private setupMouseControls() {
    const canvas = this.canvasRef.nativeElement;

    this.mouseDownHandler = (event: MouseEvent) => {
      this.isDragging = true;
      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
      canvas.style.cursor = 'grabbing';
    };

    this.mouseMoveHandler = (event: MouseEvent) => {
      if (!this.isDragging) return;

      const deltaX = event.clientX - this.previousMousePosition.x;
      const deltaY = event.clientY - this.previousMousePosition.y;

      // Update rotation based on mouse movement
      // Horizontal movement rotates around Y axis
      // Vertical movement rotates around X axis
      this.currentRotation.y += deltaX * 0.01;
      this.currentRotation.x += deltaY * 0.01;

      // Apply rotation to the sphere group
      this.sphereGroup.rotation.x = this.currentRotation.x;
      this.sphereGroup.rotation.y = this.currentRotation.y;
      this.sphereGroup.rotation.z = this.currentRotation.z;

      // Emit rotation change event
      this.rotationChange.emit({
        x: this.currentRotation.x,
        y: this.currentRotation.y,
        z: this.currentRotation.z,
      });

      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    this.mouseUpHandler = () => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('mousedown', this.mouseDownHandler);
    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);
  }

  private setupTouchControls() {
    const canvas = this.canvasRef.nativeElement;

    this.touchStartHandler = (event: TouchEvent) => {
      // Prevent page scrolling when touching the canvas
      event.preventDefault();

      if (event.touches.length === 1) {
        this.isDragging = true;
        const touch = event.touches[0];
        this.previousMousePosition = {
          x: touch.clientX,
          y: touch.clientY,
        };
        canvas.style.cursor = 'grabbing';
      }
    };

    this.touchMoveHandler = (event: TouchEvent) => {
      // Prevent page scrolling during drag
      event.preventDefault();

      if (!this.isDragging || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - this.previousMousePosition.x;
      const deltaY = touch.clientY - this.previousMousePosition.y;

      // Update rotation based on touch movement
      this.currentRotation.y += deltaX * 0.01;
      this.currentRotation.x += deltaY * 0.01;

      // Apply rotation to the sphere group
      this.sphereGroup.rotation.x = this.currentRotation.x;
      this.sphereGroup.rotation.y = this.currentRotation.y;
      this.sphereGroup.rotation.z = this.currentRotation.z;

      // Emit rotation change event
      this.rotationChange.emit({
        x: this.currentRotation.x,
        y: this.currentRotation.y,
        z: this.currentRotation.z,
      });

      this.previousMousePosition = {
        x: touch.clientX,
        y: touch.clientY,
      };
    };

    this.touchEndHandler = () => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
    };

    // Use { passive: false } to allow preventDefault()
    canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', this.touchEndHandler);
    canvas.addEventListener('touchcancel', this.touchEndHandler);
  }

  private onWindowResize() {
    if (!this.renderer || !this.camera) return;

    const container = this.elementRef.nativeElement.querySelector('.axis-control-container');
    const width = container.clientWidth || 200;
    const height = container.clientHeight || 200;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Render the scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  toggleOpen() {
    if (typeof window === 'undefined') return;

    const container = this.controlContainerRef?.nativeElement;
    const button = this.toggleButtonRef?.nativeElement;

    if (!container || !button) return;

    const currentIcon = button.querySelector('.axis-toggle-icon');
    if (!currentIcon) return;

    // Create timeline for icon swap animation
    const iconTimeline = gsap.timeline();

    // Animate current icon out (fade out + rotate)
    iconTimeline.to(currentIcon, {
      opacity: 0,
      rotation: 180,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        // Switch state after fade out
        const newState = !this.isOpen();
        this.isOpen.set(newState);

        // Animate container
        if (newState) {
          // Opening animation
          gsap.fromTo(
            container,
            {
              opacity: 0,
              scale: 0.8,
              y: 20,
            },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.4,
              ease: 'back.out(1.7)',
            }
          );
        } else {
          // Closing animation
          gsap.to(container, {
            opacity: 0,
            scale: 0.8,
            y: 20,
            duration: 0.3,
            ease: 'power2.in',
          });
        }

        // Wait a tick for Angular to render the new icon
        setTimeout(() => {
          const newIcon = button.querySelector('.axis-toggle-icon');
          if (newIcon) {
            // Set initial state for new icon
            gsap.set(newIcon, {
              opacity: 0,
              rotation: -180,
            });

            // Animate new icon in (fade in + rotate to 0)
            gsap.to(newIcon, {
              opacity: 1,
              rotation: 0,
              duration: 0.2,
              ease: 'power2.out',
            });
          }
        }, 0);
      },
    });
  }

  resetRotation() {
    // Reset to default rotation
    const defaultRotation = { x: -0.4, y: 0, z: 0 };
    this.currentRotation = { ...defaultRotation };

    // Update sphere group rotation
    if (this.sphereGroup) {
      this.sphereGroup.rotation.x = this.currentRotation.x;
      this.sphereGroup.rotation.y = this.currentRotation.y;
      this.sphereGroup.rotation.z = this.currentRotation.z;
    }

    // Emit the reset rotation
    this.rotationChange.emit(defaultRotation);
  }

  private cleanup() {
    // Cancel animation frame
    if (typeof window !== 'undefined' && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Remove event listeners
    if (typeof window !== 'undefined') {
      const canvas = this.canvasRef?.nativeElement;

      if (canvas && this.mouseDownHandler) {
        canvas.removeEventListener('mousedown', this.mouseDownHandler);
      }

      if (this.mouseMoveHandler) {
        window.removeEventListener('mousemove', this.mouseMoveHandler);
      }

      if (this.mouseUpHandler) {
        window.removeEventListener('mouseup', this.mouseUpHandler);
      }

      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
    }

    // Dispose of Three.js objects
    if (this.sphereGroup) {
      this.sphereGroup.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
