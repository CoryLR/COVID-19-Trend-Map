import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendMapComponent } from './trend-map.component';

describe('TrendMapComponent', () => {
  let component: TrendMapComponent;
  let fixture: ComponentFixture<TrendMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrendMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrendMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
