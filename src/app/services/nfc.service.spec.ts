import { TestBed } from '@angular/core/testing';

import { NfcService } from './nfc.service';

describe('NfcService', () => {
  let service: NfcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NfcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
