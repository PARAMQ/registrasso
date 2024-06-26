import {
  Component,
  Renderer2,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { ChildActivationEnd, Router } from '@angular/router';
import { WarningsService } from '../services/warnings.service';
import {
  BarcodeScanner,
  SupportedFormat,
} from '@capacitor-community/barcode-scanner';
import { AlertController, Platform, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UserDataService } from '../services/user-data.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Verificar si la tecla presionada es la tecla "Esc"
    if (event.key === 'Escape') {
      this.handleEscKey();
    }
  }

  kiosksHttps: any = {
    api_version: 1,
    id: 'd9f190df-6282-4a45-bd79-6145f9406017',
    kiosks: {
      'Congreso Abogados': {
        '3': 'Acceso General',
      },
      'Affenbits Awards': {
        '4': 'Acceso General',
        '5': 'Sala 1',
      },
    },
    locale: 'es',
    localePrefix: '',
  };
  events: any[] = [];
  selectedEvent: any = null;
  selectedActivityEvent: any = null;
  result: any = null;
  isQrCameraActive: boolean = false;
  htmlResponse: any = null;
  token: string = '';
  cardUrl: any = null;
  actionRequested: string | null = null;

  constructor(
    private router: Router,
    private advertising: WarningsService,
    private renderer: Renderer2,
    private alertController: AlertController,
    private platform: Platform,
    private api: ApiService,
    private sanitizer: DomSanitizer,
    private data: UserDataService,
    private toast: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    // this.randomlyModifyEvents();
    this.initializeBackButtonCustomHandler();
  }

  private randomlyModifyEvents() {
    const randomNumber = Math.random();
    if (randomNumber < 0.5) {
      this.events = [];
    }
  }

  private async handleEscKey(): Promise<void> {
    if (this.htmlResponse) {
      this.backToActivities();
    } else if (this.isQrCameraActive) {
      this.unselectActivityEvent();
    } else if (this.selectedActivityEvent) {
      this.unselectActivityEvent();
    } else if (this.selectedEvent) {
      this.unselectEvent();
    } else {
      await this.logout();
    }
  }

  async getToken() {
    this.token = await this.data.getToken();
    if (!this.token) {
      const toast = await this.toast.create({
        message: 'Token expirado, inicie sesión nuevamente',
        duration: 3000,
        position: 'bottom',
      });
      toast.present();
      this.router.navigate(['login']);
    }
  }

  async getKiosks() {
    this.events = [];
    const loading = await this.advertising.showLoading(
      'Cargando lista de eventos'
    );
    try {
      loading.present();
      const res = await this.api.getKiosks(this.token);
      // const res = this.kiosksHttps;
      console.log(res?.kiosks);
      const inputObject = res?.kiosks;

      if (inputObject) {
        for (const eventName in inputObject) {
          if (Object.prototype.hasOwnProperty.call(inputObject, eventName)) {
            const activities = [];

            // Recorrer las actividades de cada evento
            for (const activityId in inputObject[eventName]) {
              if (
                Object.prototype.hasOwnProperty.call(
                  inputObject[eventName],
                  activityId
                )
              ) {
                const activity = {
                  id: activityId,
                  name: inputObject[eventName][activityId],
                };

                activities.push(activity);
              }
            }

            // Construir el objeto para cada evento
            const eventObject = {
              event: eventName,
              activities: activities,
            };

            // Agregar el objeto del evento a this.events
            if (this.events) {
              this.events.push(eventObject);
            } else {
              this.events = [eventObject];
            }
          }
        }
      }

      console.log(this.events);
    } catch (err) {
      console.log(err);
    } finally {
      loading.dismiss();
    }
  }

  async ionViewDidEnter() {
    await this.getToken();
    await this.getKiosks();
  }

  initializeBackButtonCustomHandler(): void {
    this.platform.backButton.subscribeWithPriority(9999, async () => {
      if (this.htmlResponse) {
        this.backToActivities();
      } else if (this.isQrCameraActive) {
        this.unselectActivityEvent();
      } else if (this.selectedActivityEvent) {
        this.unselectActivityEvent();
      } else if (this.selectedEvent) {
        this.unselectEvent();
      } else {
        await this.logout();
      }
    });
  }

  ngOnDestroy() {
    BarcodeScanner.stopScan();
  }

  async logout() {
    const confirmationLogout = async () => {
      const loading = await this.advertising.showLoading('Cerrando sesión');
      loading.present();
      setTimeout(() => {
        loading.dismiss();
        this.router.navigate(['login']);
      }, 2000);
    };
    const alert = await this.advertising.showConfirmationAlert(
      'Estás seguro que quieres cerrar sesión?',
      () => {
        confirmationLogout();
      }
    );

    alert.present();
  }

  selectEvent(eventName: string) {
    this.events.forEach((event) => {
      if (event.event === eventName) {
        if (event.activities.length === 1) {
          this.selectActivityEvent(event.activities[0]);
          this.selectedEvent = event;
        } else {
          this.selectedEvent = event;
        }
      }
    });
  }

  unselectEvent() {
    this.selectedEvent = null;
  }

  async selectActivityEvent(activityEvent: object) {
    // Modo producción
    const allowed = await this.checkPermission();
    if (allowed) {
      this.renderer.addClass(
        document.getElementById('content'),
        'scanner-active'
      );
      this.renderer.addClass(document.body, 'scanner-active');
      this.selectedActivityEvent = activityEvent;
      this.isQrCameraActive = true;
      await this.startScanner();
    }

    // Modo testing

    // this.selectedActivityEvent = activityEvent;
    // this.result =
    //   'https://papion.demo.affenbits.com/info/abogados/C81E728D9D4C2F636F067F89CC14862C/5A8D9B1CFEBB356C73BCEFD79105DBEB';
    // await this.postQr(this.result);
  }

  unselectActivityEvent() {
    this.stopScanner();
    this.actionRequested = null;
    this.result = null;
    this.selectedActivityEvent = null;
    if (this.selectedEvent.activities.length === 1) {
      this.selectedEvent = null;
    }
  }

  async startScanner() {
    const result = await BarcodeScanner.startScan({
      targetedFormats: [SupportedFormat.QR_CODE],
    });
    if (result.hasContent) {
      // Modo producción

      this.result = result.content;

      // Modo testing
      // this.result =
      //   'https://papion.demo.affenbits.com/info/abogados/C81E728D9D4C2F636F067F89CC14862C/5A8D9B1CFEBB356C73BCEFD79105DBEB';
      // await this.postQr(this.result);

      try {
        const isUrl = this.isValidUrl(this.result);
        if (isUrl) {
          await this.postQr(this.result);
          if (!this.htmlResponse) {
            BarcodeScanner.stopScan();
            const toast = await this.toast.create({
              message: 'Qr inválido',
              duration: 3000,
              cssClass: 'custom-toast',
              position: 'bottom',
            });
            toast.present();
            this.startScanner();
            return;
          } else {
            this.stopScanner();
          }
        } else {
          await this.postQrTwo(this.result);
          if (!this.htmlResponse) {
            BarcodeScanner.stopScan();
            const toast = await this.toast.create({
              message: 'Qr inválido',
              duration: 3000,
              cssClass: 'custom-toast',
              position: 'bottom',
            });
            toast.present();
            this.startScanner();
            return;
          } else {
            this.stopScanner();
          }
        }
      } catch (err) {
        BarcodeScanner.stopScan();
        const toast = await this.toast.create({
          message: 'Qr inválido',
          duration: 3000,
          cssClass: 'custom-toast',
          position: 'bottom',
        });
        toast.present();
        this.startScanner();
        return;
      }
    }
  }

  async postQr(qrResult: string) {
    try {
      const res = await this.api.postQr(
        qrResult,
        this.selectedActivityEvent.id,
        this.token
      );
      if (res?.card) {
        this.htmlResponse = res;
        this.cardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.htmlResponse.card
        );
        this.cdr.detectChanges();
        console.log(this.htmlResponse);
      } else {
        this.htmlResponse = null;
      }
    } catch (err) {
      console.log(err);
    }
  }

  async postQrTwo(qrResult: string) {
    try {
      const res = await this.api.postQrTwo(
        qrResult,
        this.selectedActivityEvent.id,
        this.token
      );
      if (res?.card) {
        this.htmlResponse = res;
        this.cardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.htmlResponse.card
        );
        this.cdr.detectChanges();
        console.log(this.htmlResponse);
      } else {
        this.htmlResponse = null;
      }
    } catch (err) {
      console.log(err);
    }
  }

  async checkPermission() {
    return new Promise(async (resolve, reject) => {
      const status = await BarcodeScanner.checkPermission({
        force: true,
      });
      if (status.granted) {
        resolve(true);
      } else if (status.denied) {
        const alert = await this.alertController.create({
          header: 'Atención',
          message: 'Debes permitir el uso del escáner',
          buttons: [
            {
              text: 'No',
              role: 'cancel',
            },
            {
              text: 'Abrir configuración',
              handler: async () => {
                BarcodeScanner.openAppSettings();
                return resolve(false);
              },
            },
          ],
        });
        alert.present();
      } else {
        resolve(false);
      }
      console.log(status);
    });
    return status;
  }

  isValidUrl(url: string) {
    // Implementa la lógica para verificar si la cadena es una URL válida
    // Puedes usar expresiones regulares u otras técnicas
    // Devuelve true si es una URL válida, false si no lo es
    // Ejemplo simple para verificar si comienza con "http" o "https"
    return /^https?:\/\//.test(url);
  }

  stopScanner() {
    this.renderer.removeClass(
      document.getElementById('content'),
      'scanner-active'
    );
    this.renderer.removeClass(document.body, 'scanner-active');
    this.isQrCameraActive = false;
    BarcodeScanner.stopScan();
    this.cdr.detectChanges();
    console.log(this.selectedEvent);
    console.log(this.selectedActivityEvent);
    console.log(this.isQrCameraActive);
  }

  async handleRefresh(event: any) {
    await this.getKiosks();
    event.target.complete();
  }

  async backToActivities() {
    this.actionRequested = null;
    this.htmlResponse = null;
    this.cardUrl = null;
    this.result = null;
    // this.selectedActivityEvent = null;
    // if (this.selectedEvent.activities.length === 1) {
    //   this.selectedEvent = null;
    // }
    const allowed = await this.checkPermission();
    if (allowed) {
      this.renderer.addClass(
        document.getElementById('content'),
        'scanner-active'
      );
      this.renderer.addClass(document.body, 'scanner-active');
      this.isQrCameraActive = true;
      await this.startScanner();
    }
    this.cdr.detectChanges();
  }

  async handlerAction() {
    const url = this.htmlResponse?.request?.url;
    const kioskId = this.selectedActivityEvent.id;
    const loading = await this.advertising.showLoading('cargando');
    try {
      loading.present();
      const res = await this.api.postAction(url, kioskId, this.token);
      console.log(res);
      this.actionRequested = res?.message;
      if (res?.close == true) {
        loading.dismiss();
        await this.backToActivities();
      }

      // Modo producción
      // await this.postQr(this.result);

      // Modo testing
      // await this.postQr(
      //   'https://papion.demo.affenbits.com/info/abogados/C81E728D9D4C2F636F067F89CC14862C/5A8D9B1CFEBB356C73BCEFD79105DBEB'
      // );
    } catch (err) {
      console.log(err);
      const alert = await this.advertising.showAlert(
        'No se ha podido realzar la acción, intente nuevamente'
      );
      alert.present();
    } finally {
      loading.dismiss();
    }
  }
}
