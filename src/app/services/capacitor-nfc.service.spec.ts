import { TestBed } from '@angular/core/testing';

import { CapacitorNfcService } from './capacitor-nfc.service';

describe('CapacitorNfcService', () => {
  let service: CapacitorNfcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CapacitorNfcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
