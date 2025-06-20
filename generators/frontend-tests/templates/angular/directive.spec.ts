import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { <%= directiveName %>Directive } from './<%= directiveName.toLowerCase() %>.directive';

@Component({
  template: `
    <div id="default" <%= directiveName.toLowerCase() %>>Test content</div>
    <div id="with-param" [<%= directiveName.toLowerCase() %>]="'red'">Test with parameter</div>
    <div id="on-event" <%= directiveName.toLowerCase() %> (highlightMouseenter)="onMouseEnter()">Test with event</div>
  `
})
class TestComponent {
  onMouseEnter() {}
}

describe('<%= directiveName %>Directive', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let defaultElement: DebugElement;
  let paramElement: DebugElement;
  let eventElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [<%= directiveName %>Directive, TestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;

    defaultElement = fixture.debugElement.query(By.css('#default'));
    paramElement = fixture.debugElement.query(By.css('#with-param'));
    eventElement = fixture.debugElement.query(By.css('#on-event'));

    fixture.detectChanges();
  });

  it('should create an instance', () => {
    const directive = defaultElement.injector.get(<%= directiveName %>Directive);
    expect(directive).toBeTruthy();
  });

  it('should apply default highlighting', () => {
    expect(defaultElement.nativeElement.style.backgroundColor).toBe('yellow');
  });

  it('should apply custom highlighting color', () => {
    expect(paramElement.nativeElement.style.backgroundColor).toBe('red');
  });

  it('should change style on mouseenter', () => {
    // Create spy on component method
    spyOn(component, 'onMouseEnter');

    // Trigger mouseenter event
    const mouseEvent = new MouseEvent('mouseenter');
    eventElement.nativeElement.dispatchEvent(mouseEvent);
    fixture.detectChanges();

    // Check that the style has changed
    expect(eventElement.nativeElement.style.backgroundColor).toBe('yellow');
    expect(eventElement.nativeElement.style.fontWeight).toBe('bold');

    // Check that the event handler was called
    expect(component.onMouseEnter).toHaveBeenCalled();
  });

  it('should revert style on mouseleave', () => {
    // First enter
    const mouseEnterEvent = new MouseEvent('mouseenter');
    eventElement.nativeElement.dispatchEvent(mouseEnterEvent);
    fixture.detectChanges();

    // Then leave
    const mouseLeaveEvent = new MouseEvent('mouseleave');
    eventElement.nativeElement.dispatchEvent(mouseLeaveEvent);
    fixture.detectChanges();

    // Check that the style has been reset
    expect(eventElement.nativeElement.style.fontWeight).not.toBe('bold');
    expect(eventElement.nativeElement.style.backgroundColor).toBe('yellow'); // Returns to default
  });
});
