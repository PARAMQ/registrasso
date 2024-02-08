import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class WarningsService {
  constructor(
    private loading: LoadingController,
    private alert: AlertController
  ) {}

  async showLoading(msg: string) {
    const loading = await this.loading.create({
      message: msg,
    });
    return loading;
  }

  async showAlert(msg: string, headerMsg: string = 'Atención') {
    const alert = await this.alert.create({
      header: headerMsg,
      message: msg,
      cssClass: 'custom-alert',
      buttons: ['Aceptar'],
    });
    return alert;
  }

  async showConfirmationAlert(
    msg: string,
    foo: Function,
    headerMsg: string = 'Atención'
  ) {
    const alert = await this.alert.create({
      header: headerMsg,
      message: msg,
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aceptar',
          handler: async () => {
            await foo();
          },
        },
      ],
    });
    return alert;
  }

  async showPromiseAlert(
    msg: string,
    foo: Function,
    headerMsg: string = 'Atención'
  ) {
    const alert = await this.alert.create({
      header: headerMsg,
      message: msg,
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Aceptar',
          handler: async () => {
            await foo();
            await alert.dismiss();
          },
        },
      ],
    });
    return alert;
  }
}
