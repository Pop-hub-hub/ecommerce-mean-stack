import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyResetComponent } from './verify-reset.component';

describe('VerifyResetComponent', () => {
  let component: VerifyResetComponent;
  let fixture: ComponentFixture<VerifyResetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyResetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyResetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
