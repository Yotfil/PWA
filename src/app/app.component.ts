import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';

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
