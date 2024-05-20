import { Injectable, NgZone } from '@angular/core';
import {
  Nfc,
  NfcTag,
  PollingOption,
  NdefMessage, NdefRecord, RecordTypeDefinition, TypeNameFormat, UriIdentifierCode
} from '@capawesome-team/capacitor-nfc'
import { Capacitor } from '@capacitor/core'
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { NfcHelperService } from '../services/nfc-helper.service'

@Injectable({
  providedIn: 'root'
})
export class NfcService {

  private readonly scannedTagSubject = new Subject<NfcTag>()
  private readonly lastScannedTagSubject = new ReplaySubject<NfcTag>(1);
  private readonly sessionCanceledSubject = new Subject<void>();
  private readonly sessionErrorSubject = new Subject<string>();
  public message: string = ''

  constructor (
    private ngZone: NgZone,
    private nfcHelperService: NfcHelperService
  ) {
    Nfc.removeAllListeners().then(() => {
      Nfc.addListener('nfcTagScanned', event => {
        this.ngZone.run(() => {
          this.scannedTagSubject.next(event.nfcTag);
          this.lastScannedTagSubject.next(event.nfcTag)
          const records =event.nfcTag.message?.records
         if (typeof(records) != undefined) {
           records?.forEach((x) => {
             // console.log(this.transformType(x))
             // console.log(this.transformInfo(x))
             this.message = this.transformInfo((x))
           })
         }
        });
      });
      Nfc.addListener('scanSessionCanceled', () => {
        this.ngZone.run(() => {
          this.sessionCanceledSubject.next();
        });
      });
      Nfc.addListener('scanSessionError', event => {
        this.ngZone.run(() => {
          this.sessionErrorSubject.next(event.message);
        });
      });
    });
  }

  // tipo de plataforma del dispositvo
  public getPlatform(): string {
    return Capacitor.getPlatform();
  }

  // Verificar si el dispositivo soporta NFC
  public async isSupported(): Promise<boolean> {
    const { isSupported } = await Nfc.isSupported()
    return isSupported
  }

  // Verificar si está activo el NFC, dependiendo de la plataforma
  public async isEnabled(): Promise<boolean> {
    const platform = Capacitor.getPlatform()
    if (platform === 'android') {
      const { isEnabled } = await Nfc.isEnabled()
      return isEnabled
    } else if (platform === 'ios') {
      return true
    } else {
      return false
    }
  }

  // Obtiene la información del nfc tag
  public get scannedTag$(): Observable<NfcTag> {
    return this.scannedTagSubject.asObservable();
  }

  // Iniciar escaneo del NFC
  public async startScanSession(): Promise<void> {
    await Nfc.startScanSession({
      pollingOptions: [
        PollingOption.iso14443,
        PollingOption.iso15693
      ]
    })
  }

  // Detener escaneo del NFC
  public async stopScanSession(): Promise<void> {
    await Nfc.stopScanSession();
  }

  // Transformar y obtener el tipo de información del tag NFC
  public transformType(record: NdefRecord | undefined): string {
    if (!record || !record.type || !record.payload) {
      return '';
    }
    const recordTypeDefinition =
      this.nfcHelperService.mapBytesToRecordTypeDefinition({
        bytes: record.type,
      });
    switch (recordTypeDefinition) {
      case RecordTypeDefinition.AndroidApp:
        return 'Android App';
      case RecordTypeDefinition.AlternativeCarrier:
        return 'Alternative Carrier';
      case RecordTypeDefinition.HandoverCarrier:
        return 'Handover Carrier';
      case RecordTypeDefinition.HandoverRequest:
        return 'Handover Request';
      case RecordTypeDefinition.HandoverSelect:
        return 'Handover Select';
      case RecordTypeDefinition.SmartPoster:
        return 'Smart Poster';
      case RecordTypeDefinition.Text: {
        const language =
          this.nfcHelperService.getLanguageFromNdefTextRecord(record);
        return language ? `Text (${language})` : 'Text';
      }
      case RecordTypeDefinition.Uri:
        return 'Uri';
      default:
        switch (record.tnf) {
          case TypeNameFormat.Empty:
            return 'Empty';
          case TypeNameFormat.AbsoluteUri:
            return 'Absolute Uri';
          case TypeNameFormat.MimeMedia: {
            const type = this.nfcHelperService.convertBytesToString(
              record.type,
            );
            return type ? `MIME type (${type})` : 'MIME type';
          }
          case TypeNameFormat.External: {
            const type = this.nfcHelperService.convertBytesToString(
              record.type,
            );
            return type ? `External (${type})` : 'External';
          }
          default:
            return '';
        }
    }
  }

  // Transformar y obtener la info de bytes del tag NFC
  public transformInfo(record: NdefRecord | undefined): string {
    if (!record || !record.type || !record.payload) {
      return '';
    }
    const recordTypeDefinition =
      this.nfcHelperService.mapBytesToRecordTypeDefinition({
        bytes: record.type,
      });
    switch (recordTypeDefinition) {
      case RecordTypeDefinition.Text:
        return this.nfcHelperService.getTextFromNdefTextRecord(record) || '';
      case RecordTypeDefinition.Uri: {
        const identifierCode =
          this.nfcHelperService.getIdentifierCodeFromNdefUriRecord(record) ||
          UriIdentifierCode.None;
        const uri = this.nfcHelperService.getUriFromNdefUriRecord(record) || '';
        return (
          this.nfcHelperService.mapUriIdentifierCodeToText(identifierCode) + uri
        );
      }
      default:
        switch (record.tnf) {
          case TypeNameFormat.AbsoluteUri:
            return this.nfcHelperService.convertBytesToString(record.type);
          default:
            return this.nfcHelperService.convertBytesToString(record.payload);
        }
    }
  }

}
