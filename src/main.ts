import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Importaciones para Firebase
import { environment } from './environments/environment';
import { initializeApp } from 'firebase/app';

// Inicializa Firebase con la configuración de tu proyecto
initializeApp(environment.firebase);

// Inicia la aplicación Angular
bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
