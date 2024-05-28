import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private _storage: Storage | null = null;
  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  async getToken(): Promise<string> {
    const res = (await this._storage?.get('token')) || '';
    return res;
  }

  async setToken(token: string) {
    const res = await this._storage?.set('token', token);
    return res;
  }

  async getContacts(): Promise<boolean> {
    const res = (await this._storage?.get('contacts')) || false;
    return res;
  }

  async setContacts(contacts: boolean) {
    const res = await this._storage?.set('contacts', contacts);
    return res;
  }
}
