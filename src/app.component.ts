import { Component, inject } from '@angular/core';
import { SidebarComponent } from './components/sidebar.component';
import { MainViewComponent } from './components/main-view.component';
import { StoreService } from './services/store.service';

@Component({
  selector: 'app-root',
  imports: [SidebarComponent, MainViewComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  store = inject(StoreService);
}
