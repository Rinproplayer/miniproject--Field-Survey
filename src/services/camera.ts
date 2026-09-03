import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export async function takePhoto(): Promise<string | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      return image.dataUrl || null;
    } else {
      // PWA / Browser fallback: try Capacitor Camera web or use file picker
      try {
        const image = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt,
        });
        return image.dataUrl || null;
      } catch (webErr) {
        console.warn('Capacitor camera web fallback triggered:', webErr);
        return await openWebFilePicker();
      }
    }
  } catch (error) {
    console.warn('Camera capture canceled or failed:', error);
    return null;
  }
}

export function openWebFilePicker(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(file);
    };

    input.click();
  });
}
