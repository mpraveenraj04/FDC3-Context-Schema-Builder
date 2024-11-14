import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { PanelModule } from 'primeng/panel';
import { CheckboxModule } from 'primeng/checkbox';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Property {
  name: string;
  title?: string;
  type: string;
  description?: string;
  properties?: Property[];
  children?: Property[]; // For nested properties
  stringOption?: string;
  stringValue?: string;
  required?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    PanelModule,
    CommonModule,
    CheckboxModule,

  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})



export class AppComponent {

  constructor(private http: HttpClient) {}

  languageOptions = [
    { label: 'Java', value: 'java' },
    { label: 'Javascript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Python', value: 'python' }
  ];

  fileExtensions: { [key: string]: string } = {
    java: 'java',
    javascript: 'js',
    typescript: 'ts',
    python: 'py'
  };

  selectedLanguage = 'java';
  generatedCode = '';
  generatedJsonString ='';

  properties: Property[] = [];
  compositionTypeKeyToReplace: string = "";

  types = [
    { label: 'string', value: 'string' },
    { label: 'number', value: 'number' },
    { label: 'boolean', value: 'boolean' },
    { label: 'object', value: 'object' },
    { label: 'const', value: 'const' },
    { label: '$ref', value: '$ref' }
  ];

  compositionOptions = [
    { label: 'allOf', value: 'allOf' },
    { label: 'oneOf', value: 'oneOf' },
    { label: 'anyOf', value: 'anyOf' }
  ];

  stringOptions = [
    { label: 'format', value: 'format' },
    { label: 'pattern', value: 'pattern' },
    { label: 'enum', value: 'enum' }
  ];



  baseSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "https://fdc3.finos.org/schemas/next/context/action.schema.json",
    "title": "Context Name",
    "description": "Context Description",
    "compositionType": [
      {
        "type": "object",
        "properties": {
          "type": {
            "const": "fdc3.contexttitle"
          },
          "dummy": {}
        }
      },
      {
        "$ref": "context.schema.json#/definitions/BaseContext"
      }
    ]
  }


  updateCompositionType() {
    const selectedValue = this.compositionTypeKeyToReplace;  // Get selected value (e.g., 'allOf', 'oneOf')
    const contextName = this.baseSchema.title


    if (this.baseSchema.compositionType && selectedValue) {

      let baseSchemaString = JSON.stringify(this.baseSchema);

      // Replace the 'compositionType' key with the selected value (e.g., 'allOf', 'oneOf')
      baseSchemaString = baseSchemaString.replace('"compositionType":', `"${selectedValue}":`);
      this.baseSchema = JSON.parse(baseSchemaString);

    }
  }

  updateConstWithTitle() {
    // Retrieve the title value from baseSchema
    const titleValue = this.baseSchema.title;

    // Update the "const" field with the new value
    if (this.baseSchema.compositionType[0]?.properties?.type) {

      this.baseSchema.compositionType[0].properties.type.const = `fdc3.${titleValue.toLowerCase().replace(/\s+/g, '')}`;
    }
  }


  addProperty(parent?: Property) {
    const newProperty: Property = { name: '', type: '', description: '', properties: [] };

    if (parent) {
      parent.children = parent.children || []; // Ensure children array exists
      parent.children.push(newProperty); // Add nested property
    } else {
      this.properties.push(newProperty); // Add top-level property
    }
  }

  removeProperty(parentList: Property[], index: number) {
    parentList.splice(index, 1);
  }


  generateJSON() {
    const schema: any = {};
    const requiredFields: string[] = [];

    // Build the schema object recursively
    this.properties.forEach(property => {
      this.buildSchemaObject(property, schema, requiredFields);
    });

    if (requiredFields.length > 0) {
      schema.required = requiredFields;
    }

    let baseSchemaString = JSON.stringify(this.baseSchema, null, 2);

    // Define a regex pattern to match "dummy": { ... }
    const regex = /("dummy"\s*:\s*\{[^}]*\})/;


    if (regex.test(baseSchemaString)) {
      // Replace the "dummy" object with the new schema string (remove curly braces around the schema)+
      let schemaString = JSON.stringify(schema, null, 8);

      // Check if schemaString is non-empty and remove trailing curly braces if it's empty object '{}'
      if (schemaString) {
        schemaString = schemaString.slice(1, -1);
      }
      

      baseSchemaString = baseSchemaString.replace(regex, schemaString);
      this.generatedJsonString =  baseSchemaString.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
      return baseSchemaString;
    } else {
      
      console.error('Dummy property not found in the base schema.');
      this.generatedJsonString = baseSchemaString.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
      return baseSchemaString;
    }
  }


  replacer(key: string, value: any): any {
    return this.isEmpty(value) ? undefined : value;
  }

  isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (Array.isArray(value)) {
      return value.every(item => this.isEmpty(item)); // Recursively check for array elements
    } else if (typeof value === 'object') {
      return Object.values(value).every(val => this.isEmpty(val)); // Recursively check for object values
    }

    return false;
  }

  // Recursive function to handle nested properties
  buildSchemaObject(property: Property, target: any, requiredFields: string[]) {
    
    const propertyName = property.name;

    
    const propertySchema: any = {
      type: property.type,     
      title: property.title || '',
      description: property.description || ''
    };
    

    // Handle string-specific properties
    if (property.type === 'string' && property.stringOption) {
      if (property.stringOption === 'enum') {
        // Convert comma-separated values into an array
        propertySchema.enum = property.stringValue
          ? property.stringValue.split(',').map(value => value.trim())
          : []; // Split and trim values
      } else {
        propertySchema[property.stringOption] = property.stringValue;
      }
    } else if (property.type === 'const') {
      propertySchema.const = property.stringValue;
    } else if ( property.type === '$ref') {
      propertySchema.$ref = property.stringValue;
    }

    if (property.required && property.type !== 'object') {
      requiredFields.push(propertyName);
    }
    // If there are nested properties (children), process them recursively
    if (property.children && property.children.length > 0) {
      propertySchema.properties = {};
      property.children.forEach(child => {
        this.buildSchemaObject(child, propertySchema.properties, requiredFields);
      });
    }

    // Add the property to the target object using the name as the key
    target[propertyName] = propertySchema;
  }

  onStringOptionChange(property: Property) {
    property.stringValue = '';  // Reset value whenever the option changes
  }


  generatePojo() {

    if (!this.generatedJsonString) {
      
      this.generatedJsonString = this.generateJSON(); // Ensure JSON is generated
     
    }
     
    // Prepare data to be sent in the request
    const data = {
      jsonString: this.generatedJsonString,
      targetLanguage: this.selectedLanguage, // Correct property name
      typeName: 'GeneratedPojo'
    };

     
    // Make POST request to the Node.js backend
    this.http.post<any>('http://localhost:5000/generatepojo', data)
      .subscribe(response => {
        if (response && response.code) {
          this.generatedCode = response.code; // Save code to display or format if needed
          this.downloadCodeFile(response.code, this.selectedLanguage);
        } else {
          console.error('Error: No code received in the response.');
        }
      }, error => {
        console.error('Error generating POJO:', error);
      });
  }

  downloadCodeFile(code: string, language: string) {
    // Define file name and extension based on language
    const extension = this.fileExtensions[language] || 'txt'; // Default to .txt if language is unsupported
    const fileName = `GeneratedPojo.${extension}`;

    // Create a Blob with the code content
    const blob = new Blob([code], { type: 'text/plain' });

    // Create an anchor element to trigger a download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();

    // Release the Blob URL to free memory
    window.URL.revokeObjectURL(url);
  }
}
