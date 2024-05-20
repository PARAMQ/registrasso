import { TestBed } from '@angular/core/testing';

import { NfcHelperService } from './nfc-helper.service';

describe('NfcHelperService', () => {
  let service: NfcHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NfcHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
