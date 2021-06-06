import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListenerComponent } from './listener.component';

describe('ListenerComponent', () => {
  let component: ListenerComponent;
  let fixture: ComponentFixture<ListenerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListenerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListenerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
