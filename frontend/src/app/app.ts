import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DevToolsDetectionService } from './core/services/devtools-detection.service';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private devToolsDetection = inject(DevToolsDetectionService);

  ngOnInit() {
    // Initialize DevTools detection
    // Service will auto-start detection on creation
  }
}
