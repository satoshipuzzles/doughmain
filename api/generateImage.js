const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.DOUGHMAIN_OPENAI_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain name is required' });
    }

    // Extract domain name without TLD
    const domainName = domain.split('.')[0];

    console.log(`Generating logo for domain: ${domainName}`);

    // Call OpenAI API to generate a logo using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a modern, professional logo for a brand called "${domainName}". 
      The logo should be minimal, memorable, and work well at different sizes. 
      Use a color palette that reflects the essence of the name. 
      Include a simple icon that represents the concept along with the name in a clean, 
      contemporary font. Make it suitable for a digital business. 
      No text other than the brand name. White background, no borders.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
      style: "vivid"
    });
    
    console.log('OpenAI image generation response:', JSON.stringify(response, null, 2));
    
    // Extract the image URL from the response
    const imageUrl = response.data[0].url;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    // You could save the image to your own storage here if needed
    // For this example, we'll just return the URL from OpenAI

    return res.status(200).json({
      imageUrl: imageUrl,
      domain: domain
    });
  } catch (error) {
    console.error('Error generating image:', error);
    console.error('Error details:', error.message);
    
    if (error.response) {
      console.error('OpenAI API error:', error.response.data);
    }
    
    return res.status(500).json({ 
      error: 'Failed to generate logo', 
      message: error.message,
      details: error.response ? error.response.data : null
    });
  }
} 