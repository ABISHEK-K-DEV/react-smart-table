# 🔐 React Smart Table Secure AI-Powered Data Management

[![npm version](https://badge.fury.io/js/%40abisheks238%2Freact-smart-table.svg)](https://badge.fury.io/js/%40abisheks238%2Freact-smart-table)
[![Security Rating](https://img.shields.io/badge/security-A+-green.svg)](https://github.com/ABISHEK-K-DEV/react-smart-table)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready, enterprise-grade React table component with built-in AI assistance, comprehensive security features, and real-time validation.

🛡️ Security Features

🔐 Secure AI Integration: No API keys exposed in browser
🚫 XSS Protection: Input sanitization and output encoding
⚡ Rate Limiting: Prevents API abuse and DoS attacks
📁 Secure File Handling: File type and size validation
🔍 Input Validation: Comprehensive data validation
🛡️ CSRF Protection: Built-in CSRF token support
📏 Content Length Limits: Prevents buffer overflow attacks

🚀 Quick Start

Installation

bash
npm install @abisheks238/react-smart-table


Basic Usage

tsx
import { SmartTable } from '@abisheks238/react-smart-table';

const MyComponent = () => {
  const columns = [
    {
      id: 'name',
      header: 'Name',
      type: 'text',
      editable: true,
      required: true
    },
    {
      id: 'email',
      header: 'Email',
      type: 'email',
      editable: true,
      aiEnabled: true
    }
  ];

  const data = [
    { id: '1', name: 'John Doe', email: 'john@example.com' }
  ];

  return (
    <SmartTable
      columns={columns}
      data={data}
      aiConfig={{
        enabled: true,
        apiEndpoint: '/api/ai-suggestions', Secure server endpoint
        provider: 'openai'
      }}
    />
  );
};


🔧 Secure AI Configuration

❌ Don't do this (Insecure):
tsx
Never expose API keys in the browser!
const aiConfig = {
  apiKey: 'sk-...',  SECURITY RISK!
  provider: 'openai'
};


✅ Do this (Secure):
tsx
Use a secure server endpoint
const aiConfig = {
  enabled: true,
  apiEndpoint: '/api/ai-suggestions',
  provider: 'openai',
  rateLimitPerMinute: 10,
  maxBulkSize: 50
};


 Server-Side AI Endpoint Example

javascript
/api/ai-suggestions
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, 1 minute
  max: 10 limit each IP to 10 requests per windowMs
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY Secure server-side storage
});

export default async function handler(req, res) {
  Apply rate limiting
  await limiter(req, res);
  
  Validate and sanitize input
  const { column, context } = req.body;
  
  Your AI logic here...
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [/* your messages */]
  });
  
  res.json({ suggestion: response.choices[0].message.content });
}


📊 Features

 Core Features
✅ Editable Cells with real-time validation
🔍 Advanced Filtering and sorting
📤 Secure Export (CSV/JSON) with sanitization
📥 Safe Import with file validation
🎨 Dark Mode support
📱 Responsive Design

 AI Features
🤖 Smart Autofill via secure API
📝 Bulk Suggestions with rate limiting
🧠 Context-Aware recommendations
⚡ Real-time assistance

 Security Features
🛡️ Input Sanitization
🔐 XSS Prevention
📏 Content Limits
⚡ Rate Limiting
📁 File Validation

🎛️ Configuration Options

tsx
interface SmartTableProps {
  columns: TableColumn[];
  data: TableRow[];
  onDataChange?: (data: TableRow[]) => void;
  aiConfig?: AIConfig;
  validationSchema?: ValidationSchema;
  className?: string;
  enableSearch?: boolean;        default: true
  enableFilters?: boolean;       default: true
  enableExport?: boolean;        default: true
  enableAdd?: boolean;           default: true
  enableDelete?: boolean;        default: true
  pageSize?: number;            default: 10
  realTimeSync?: boolean;       default: false
  theme?: 'light' | 'dark' | 'auto'; default: 'auto'
  animations?: boolean;         default: true
}


🔒 Security Best Practices

1. AI Configuration
tsx
✅ Secure: Use server endpoints
const secureAIConfig = {
  enabled: true,
  apiEndpoint: '/api/ai-suggestions',
  rateLimitPerMinute: 10
};

❌ Never do this
const insecureConfig = {
  apiKey: 'sk-...', Exposed to client!
};


 2. Input Validation
tsx
import { z } from 'zod';

const validationSchema = {
  email: z.string().email().max(254),
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(150)
};


 3. File Upload Security
tsx
Automatic security measures:
File size limits (50MB)
Type validation (CSV only)
Content sanitization
Row limits (10,000)


🧪 Testing

bash
npm test


📝 Contributing

1. Fork the repository
2. Create a security-focused feature branch
3. Run security tests: `npm run security-test`
4. Submit a pull request

🐛 Security Issues

Please report security vulnerabilities privately to: security@example.com

📄 License

MIT License see [LICENSE](LICENSE) file for details.

🙏 Acknowledgments

Built with security-first principles
Follows OWASP guidelines
Enterprise-ready architecture



⚠️ Security Notice: Always validate and sanitize data on both client and server sides. This component provides client-side security measures but should be complemented with server-side validation.