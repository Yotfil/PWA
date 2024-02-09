import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  imageSrc: string | null = null;
  cameraStream: MediaStream | null = null;

  constructor(private storage: AngularFireStorage) {
    // Puedes usar `storage` aquí o en otros métodos de tu componente
  }

  async ngOnInit(): Promise<void> {
    await this.startCamera();
  }

  async startCamera(): Promise<void> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.cameraStream;
        }
      }
    } catch (error) {
      console.error('Error accessing the camera:', error);
    }
  }

  async capturePhoto(): Promise<void> {
    if (this.cameraStream && this.videoElement.nativeElement) {
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.nativeElement.videoWidth;
      canvas.height = this.videoElement.nativeElement.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(
        this.videoElement.nativeElement,
        0,
        0,
        canvas.width,
        canvas.height
      );

      this.imageSrc = canvas.toDataURL('image/jpeg');
      this.stopCameraStream();

      // Convertir dataURL a Blob
      const photoBlob = await fetch(this.imageSrc).then((res) => res.blob());

      // Generar un nombre único para el archivo
      const photoName = `photo_${Date.now()}.jpg`;

      if (navigator.onLine) {
        // Si está online, subir la foto a Firebase Storage
        const photoRef = this.storage.ref(photoName);
        const uploadTask = photoRef.put(photoBlob);

        uploadTask
          .snapshotChanges()
          .pipe(
            // Utiliza `finalize` para ejecutar una acción después de que la tarea de subida se haya completado
            finalize(async () => {
              // Obtén la URL de descarga
              const photoURL = await photoRef.getDownloadURL().toPromise();
              console.log('Foto subida con URL:', photoURL);
              // Aquí puedes guardar la URL de la foto en Firestore o en otro lugar si necesitas.
            })
          )
          .subscribe();
      } else {
        // Si está offline, guardar la foto en IndexedDB para sincronizar más tarde
        // Necesitarás implementar una función para guardar y recuperar de IndexedDB.
        // this.savePhotoOffline(photoBlob);
        console.log('No se puede subir la foto porque está offline');
      }
    }
  }

  async retakePhoto(): Promise<void> {
    this.imageSrc = null;
    // if (this.cameraStream) {
    await this.startCamera();
    // }
  }

  stopCameraStream(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
  }
}
