import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-hello',
  standalone: true,
  template: `
    <div class="p-6 bg-linear-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold mb-4">Hello from Angular!!</h2>

      @if (show()) {
        <p class="mb-4 p-3 bg-white/20 rounded backdrop-blur-sm">{{ helpText() }}</p>
      }

      <button
        (click)="toggle()"
        class="px-4 py-2 bg-white text-purple-600 font-semibold rounded-md hover:bg-purple-50 transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        {{ show() ? 'Hide' : 'Show' }} Help Text
      </button>
    </div>
  `,
})
export class HelloComponent {
  helpText = input('help');

  show = signal(false);

  toggle() {
    this.show.update((show) => !show);
  }
}