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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a domain name analysis expert with extensive knowledge of domain valuation, marketability, and business potential."
        },
        {
          role: "user",
          content: `Provide a basic analysis of the domain name "${domain}". Include the following sections:
          1. Overall impression and potential use cases
          2. Marketability assessment
          3. Value estimation range (in USD)
          4. Key strengths and weaknesses`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const analysis = completion.choices[0].message.content;
    
    // Extract estimated value range using regex
    const valueRangeMatch = analysis.match(/\$\s*[\d,]+\s*-\s*\$\s*[\d,]+/);
    const valueRange = valueRangeMatch ? valueRangeMatch[0].replace(/[^0-9\-]/g, '') : '1000-5000';
    const [minValue, maxValue] = valueRange.split('-').map(v => parseInt(v.trim(), 10));
    const avgValue = Math.round((minValue + maxValue) / 2);
    
    // Create metrics
    const metrics = {
      "Estimated Value": `$${avgValue.toLocaleString()}`,
      "Brandability": generateScore(domain),
      "Memorability": generateScore(domain),
      "Marketing Potential": generateScore(domain),
      "SEO Friendliness": generateScore(domain)
    };

    return res.status(200).json({
      title: `Basic Analysis: ${domain}`,
      content: analysis,
      metrics: metrics
    });
  } catch (error) {
    console.error('Error generating basic report:', error);
    return res.status(500).json({ error: 'Failed to generate basic report' });
  }
}

// Helper function to generate a score based on domain characteristics
function generateScore(domain) {
  // This is a simple placeholder. In a real app, you'd have more sophisticated scoring
  const length = domain.length;
  const hasHyphen = domain.includes('-');
  const tldMatch = domain.match(/\.([a-z]+)$/i);
  const tld = tldMatch ? tldMatch[1].toLowerCase() : 'com';
  
  // Base score between 60-90
  let score = 75;
  
  // Length factor: prefer domains between 5-12 characters
  if (length < 5) score -= 5;
  else if (length > 12) score -= (length - 12) * 2;
  else if (length >= 5 && length <= 8) score += 5;
  
  // Hyphen penalty
  if (hasHyphen) score -= 10;
  
  // TLD factor
  if (tld === 'com') score += 10;
  else if (['net', 'org', 'io'].includes(tld)) score += 5;
  
  // Normalize score between 1-100
  score = Math.max(1, Math.min(100, score));
  
  // Return score with random variation
  const variation = Math.floor(Math.random() * 10) - 5;
  return `${Math.max(1, Math.min(100, score + variation))}/100`;
} 