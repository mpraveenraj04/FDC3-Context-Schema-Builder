import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';

interface Property {
  name: string;
  title?: string;
  type: string;
  description?: string;
  properties?: Property[];
  children?: Property[]; // Explicitly typed as an array of `Property`
  stringOption?: string;
  stringValue?: string;
  required?: boolean;
}

describe('AppComponent', () => {
  let component: AppComponent;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AppComponent, // Add AppComponent to imports instead of declarations
        HttpClientTestingModule,
        FormsModule,
        InputTextModule,
        ButtonModule,
        DropdownModule
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  
  
  describe('addProperty', () => {
    it('should add a top-level property', () => {
      component.addProperty();
      expect(component.properties.length).toBe(1);
      expect(component.properties[0].name).toBe('');
    });

    it('should add a nested property', () => {
      const parent: Property = { name: 'parent', type: 'object', children: [] }; // Initialize children
      component.addProperty(parent);
    
      expect(parent.children!.length).toBe(1);
      expect(parent.children![0].name).toBe(''); // Safe access since children is initialized
    });
  });

  describe('removeProperty', () => {
    it('should remove a property from the properties array', () => {
      component.addProperty();
      expect(component.properties.length).toBe(1);

      component.removeProperty(component.properties, 0);
      expect(component.properties.length).toBe(0);
    });
  });

  describe('updateConstWithTitle', () => {
    it('should update the const property based on the title', () => {
      component.baseSchema.title = 'Test Title';
      component.updateConstWithTitle();
    
      expect(component.baseSchema.compositionType[0]?.properties?.type?.const).toBe('fdc3.testtitle');
    });
    
  });
});



