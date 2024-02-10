import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, getStorage } from 'firebase/storage';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  imageSrc: string | null = null;
  cameraStream: MediaStream | null = null;
  pendingImages: Blob[] = [];
  constructor(private firestore: Firestore) {
    // Inicializa Firebase
  }

  public async ngOnInit(): Promise<void> {
    await this.startCamera(); // Asegúrate de que esta línea esté comentada si no estás usando la cámara aquí

    try {
      const testCollection = collection(this.firestore, 'testing');
      const docRef = await addDoc(testCollection, {
        text: 'i love fire base again',
      });
      console.log('Document written with Id: ', docRef.id);
    } catch (e) {
      console.error('Error adding document: ', e);
    }

    window.addEventListener('online', () => this.syncPendingImages());
  }

  async syncPendingImages(): Promise<void> {
    while (this.pendingImages.length > 0) {
      const imageBlob = this.pendingImages.shift(); // Obtener y remover la imagen de la cola
      if (imageBlob) {
        await this.uploadAndStoreImage(imageBlob);
        console.log('Imagen sincronizada con Firebase');
      }
    }
  }

  async uploadImage(imageBlob: Blob): Promise<string> {
    const storage = getStorage();
    const storageRef = ref(storage, 'images/' + new Date().getTime());
    await uploadBytes(storageRef, imageBlob);
    return await getDownloadURL(storageRef);
  }

  async uploadAndStoreImage(blob: Blob): Promise<void> {
    const imageUrl = await this.uploadImage(blob); // La función de subida existente
    // Guardar referencia de la imagen en Firestore, lógica existente...
    // const imageUrl = await this.uploadImage(blob); // Asume que uploadImage es un método en este componente o en un servicio inyectado que sube la imagen y devuelve la URL

    // Guardar referencia de la imagen en Firestore
    const imageRef = await addDoc(collection(this.firestore, 'images'), {
      url: imageUrl,
      createdAt: new Date(),
    });

    console.log('Imagen almacenada con ID:', imageRef.id);
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
      const blob = await (await fetch(this.imageSrc)).blob();

      if (!navigator.onLine) {
        this.pendingImages.push(blob);
        console.log(
          this.pendingImages,
          'Añadido a la cola de imágenes pendientes'
        );
        console.log('Añadido a la cola de imágenes pendientes');
      } else {
        await this.uploadAndStoreImage(blob);
      }

      this.stopCameraStream();
    }
  }

  async retakePhoto(): Promise<void> {
    this.imageSrc = null;
    await this.startCamera();
  }

  stopCameraStream(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
  }
}
