import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserDataService } from './user-data.service';
import { environment } from 'src/environments/environment';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  url: string = environment.api;

  constructor(private http: HttpClient, private data: UserDataService) {}

  // Auth //

  login(username: string, password: string) {
    const url = this.url + 'users/login';
    const body = new FormData();
    body.append('username', username);
    body.append('password', password);

    return lastValueFrom(this.http.post<any>(url, body));
  }

  // Kiosks //

  getKiosks(token: string) {
    const url = this.url + 'kiosks/get';
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    console.log(headers);
    return lastValueFrom(this.http.get<any>(url, { headers: headers }));
  }

  // QR Post //

  postQr(url: string, kioskId: any, token: string) {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const body = new FormData();
    body.append('kiosk', kioskId);

    return lastValueFrom(this.http.post<any>(url, body, { headers: headers }));
  }

  // Action button Post //

  postAction(url: string, kioskId: any, token: string) {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const body = new FormData();
    body.append('kiosk', kioskId);

    return lastValueFrom(this.http.post<any>(url, body, { headers: headers }));
  }
}
