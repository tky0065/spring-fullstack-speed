import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { <%= componentName %>Component } from './<%= componentName.toLowerCase() %>.component';

describe('<%= componentName %>Component', () => {
  let component: <%= componentName %>Component;
  let fixture: ComponentFixture<<%= componentName %>Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [<%= componentName %>Component],
    }).compileComponents();

    fixture = TestBed.createComponent(<%= componentName %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the button label', () => {
    component.label = 'Click me';
    fixture.detectChanges();
    const buttonElement = fixture.debugElement.query(By.css('button')).nativeElement;
    expect(buttonElement.textContent).toContain('Click me');
  });

  it('should emit click event when clicked', () => {
    // Spy on the output event
    spyOn(component.click, 'emit');

    // Trigger click
    const buttonElement = fixture.debugElement.query(By.css('button')).nativeElement;
    buttonElement.click();

    // Verify the output was emitted
    expect(component.click.emit).toHaveBeenCalled();
  });

  it('should be disabled when disabled input is true', () => {
    component.disabled = true;
    fixture.detectChanges();

    const buttonElement = fixture.debugElement.query(By.css('button')).nativeElement;
    expect(buttonElement.disabled).toBeTruthy();
  });

  it('should have primary class when variant is primary', () => {
    component.variant = 'primary';
    fixture.detectChanges();

    const buttonElement = fixture.debugElement.query(By.css('button')).nativeElement;
    expect(buttonElement.classList).toContain('btn-primary');
  });
});
