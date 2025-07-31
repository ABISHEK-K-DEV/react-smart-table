import { createTableSchema } from '../../src/utils/schema';
import { z } from 'zod';
import { TableColumn } from '../../src/types';

describe('createTableSchema', () => {
  it('should create a valid schema for text columns', () => {
    const columns: TableColumn[] = [
      {
        id: 'name',
        header: 'Name',
        type: 'text',
        required: true
      }
    ];
    
    const schema = createTableSchema(columns);
    
    // Validation should pass for valid text
    expect(() => schema.name.parse('John Doe')).not.toThrow();
    
    // Validation should fail for empty text when required
    expect(() => schema.name.parse('')).toThrow();
  });

  it('should create a valid schema for email columns', () => {
    const columns: TableColumn[] = [
      {
        id: 'email',
        header: 'Email',
        type: 'email'
      }
    ];
    
    const schema = createTableSchema(columns);
    
    // Validation should pass for valid email
    expect(() => schema.email.parse('test@example.com')).not.toThrow();
    
    // Validation should fail for invalid email
    expect(() => schema.email.parse('invalid-email')).toThrow();
  });

  it('should handle optional fields correctly', () => {
    const columns: TableColumn[] = [
      {
        id: 'notes',
        header: 'Notes',
        type: 'text',
        required: false
      }
    ];
    
    const schema = createTableSchema(columns);
    
    // Optional fields should accept empty strings
    expect(() => schema.notes.parse('')).not.toThrow();
    expect(() => schema.notes.parse(null)).not.toThrow();
    expect(() => schema.notes.parse(undefined)).not.toThrow();
  });

  it('should apply custom validation when provided', () => {
    const customValidator = z.string().min(10).max(20);
    
    const columns: TableColumn[] = [
      {
        id: 'password',
        header: 'Password',
        type: 'text',
        validation: customValidator
      }
    ];
    
    const schema = createTableSchema(columns);
    
    // Should use custom validation rules
    expect(() => schema.password.parse('short')).toThrow();
    expect(() => schema.password.parse('perfect_password')).not.toThrow();
    expect(() => schema.password.parse('this_password_is_way_too_long')).toThrow();
  });
});
