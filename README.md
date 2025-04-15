# Doughmain - Domain Analysis Tool

Doughmain is a comprehensive domain analysis application that helps users evaluate domain names for investment or development purposes.

## Features

- **Basic Report**: Quick overview of domain value and potential
- **Detailed Analysis**: Comprehensive domain evaluation with industry insights
- **Sales History**: Check previous sales data for similar domains
- **Similar Domains**: Find alternative domain options with price estimates
- **Logo Generator**: Create brand logo concepts for domains

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Serverless API endpoints (Vercel)
- AI Integration: OpenAI GPT-4o and DALL-E 3

## Deployment

This application is designed to be deployed on Vercel with the following configuration:

1. Set up the `DOUGHMAIN_OPENAI_KEY` environment variable with your OpenAI API key
2. Deploy the application to Vercel

## Local Development

To run the project locally:

1. Clone the repository
2. Create a `.env` file with your OpenAI API key
3. Use a local server like `http-server` or Vercel's local development tools

## Project Structure

```
doughmain/
├── api/                   # Serverless API endpoints
│   ├── generateBasicReport.js
│   ├── generateDetailedReport.js
│   ├── generateImage.js
│   ├── checkSalesHistory.js
│   └── getSimilarDomains.js
├── public/                # Static assets
│   └── assets/
│       └── logo.svg
├── styles/                # CSS stylesheets
│   ├── globals.css
│   └── components.css
├── index.html            # Main HTML file
├── script.js             # Frontend JavaScript
└── vercel.json           # Vercel configuration
```

## License

MIT 