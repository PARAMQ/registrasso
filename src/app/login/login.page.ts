import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WarningsService } from '../services/warnings.service';
import { ApiService } from '../services/api.service';
import { jwtDecode } from 'jwt-decode';
import { UserDataService } from '../services/user-data.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  username: string | null = null;
  password: string | null = null;

  constructor(
    private router: Router,
    private advertising: WarningsService,
    private api: ApiService,
    private data: UserDataService
  ) {}

  ngOnInit() {}

  async login() {
    if (this.username && this.password) {
      const loading = await this.advertising.showLoading('Cargando');
      loading.present();
      try {
        const res: any = await this.api.login(this.username, this.password);
        await this.data.setToken(res?.jwt);
        console.log(res.jwt);
        console.log(await this.data.getToken());
        this.router.navigate(['home']);
      } catch (err: any) {
        if (err?.statusText === 'Unauthorized') {
          const alert = await this.advertising.showAlert(
            'Usuario y/o contraseña inválido'
          );
          alert.present();
        } else {
          const alert = await this.advertising.showAlert(
            'Ha ocurrido un problema al establecer la conexión, intente nuevamente'
          );
          alert.present();
        }
        console.log(err);
      } finally {
        loading.dismiss();
      }
    } else {
      const alert = await this.advertising.showAlert(
        'Favor de llenar todos los campos.'
      );
      alert.present();
    }
  }
}
