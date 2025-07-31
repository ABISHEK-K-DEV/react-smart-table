import { z } from 'zod';
import { TableColumn, ValidationSchema } from '../types';

export const createTableSchema = (columns: TableColumn[]): ValidationSchema => {
  const schema: ValidationSchema = {};

  columns.forEach(column => {
    let columnSchema: z.ZodSchema = z.any();

    switch (column.type) {
      case 'text':
        columnSchema = z.string();
        break;
      case 'email':
        columnSchema = z.string().email('Please enter a valid email address');
        break;
      case 'number':
        columnSchema = z.number();
        break;
      case 'date':
        columnSchema = z.string().refine(
          (date) => !isNaN(Date.parse(date)),
          'Please enter a valid date'
        );
        break;
      case 'boolean':
        columnSchema = z.boolean();
        break;
      case 'select':
        if (column.options && column.options.length > 0) {
          columnSchema = z.enum(column.options as [string, ...string[]]);
        } else {
          columnSchema = z.string();
        }
        break;
    }

    if (column.required) {
      columnSchema = columnSchema.refine(
        (val) => val !== null && val !== undefined && val !== '',
        `${column.header} is required`
      );
    } else {
      columnSchema = columnSchema.optional().nullable();
    }

    // Apply custom validation if provided
    if (column.validation) {
      columnSchema = column.validation;
    }

    schema[column.id] = columnSchema;
  });

  return schema;
};
