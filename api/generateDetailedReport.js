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

    // Extract TLD and name
    const tldMatch = domain.match(/\.([a-z]+)$/i);
    const tld = tldMatch ? tldMatch[1].toLowerCase() : 'com';
    const nameOnly = domain.replace(/\.[a-z]+$/i, '');

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in domain name valuation, branding, and digital marketing. 
          Provide detailed, data-driven analysis with specific recommendations.`
        },
        {
          role: "user",
          content: `Generate a comprehensive analysis for the domain "${domain}". Include:
          
          1. Detailed market analysis and potential industries this domain would be valuable for
          2. Comparative analysis with similar domains
          3. SEO potential analysis and keyword opportunities
          4. Branding potential and target audience identification
          5. Investment outlook (short and long term)
          6. Specific recommendations for development or selling strategy
          7. Detailed value assessment with multiple factors considered`
        }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const analysis = completion.choices[0].message.content;
    
    // Generate additional metrics for the detailed report
    const metrics = {
      "Domain Age Potential": `${Math.floor(Math.random() * 5) + 1}/5`,
      "Development ROI": `${Math.floor(Math.random() * 5) + 1}/5`,
      "Investment Grade": getInvestmentGrade(domain),
      "Market Demand": `${Math.floor(Math.random() * 5) + 1}/5`,
      "Keyword Value": `${Math.floor(Math.random() * 5) + 1}/5`,
      "TLD Strength": getTldStrength(tld),
      "Character Count": `${nameOnly.length} (${getCharacterCountRating(nameOnly.length)})`,
      "Pronounceability": getPronounceabilityScore(nameOnly)
    };

    return res.status(200).json({
      title: `Detailed Analysis: ${domain}`,
      content: analysis,
      metrics: metrics
    });
  } catch (error) {
    console.error('Error generating detailed report:', error);
    return res.status(500).json({ error: 'Failed to generate detailed report' });
  }
}

// Helper function to generate investment grade
function getInvestmentGrade(domain) {
  const grades = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'];
  
  // Simple heuristic: shorter domains with .com TLD get better grades
  const length = domain.length;
  const isCom = domain.endsWith('.com');
  
  let index;
  if (length <= 5 && isCom) {
    index = 0; // AAA
  } else if (length <= 8 && isCom) {
    index = 1; // AA
  } else if (length <= 12 && isCom) {
    index = 2; // A
  } else if (length <= 15) {
    index = 3; // BBB
  } else if (length <= 20) {
    index = 4; // BB
  } else {
    index = Math.min(5 + Math.floor((length - 20) / 5), 6); // B or CCC
  }
  
  // Add some randomness
  const randomShift = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  index = Math.max(0, Math.min(6, index + randomShift));
  
  return grades[index];
}

// Helper function to get TLD strength
function getTldStrength(tld) {
  const tldRatings = {
    'com': 'Excellent',
    'net': 'Good',
    'org': 'Good',
    'io': 'Good',
    'co': 'Good',
    'ai': 'Excellent',
    'app': 'Good',
    'tech': 'Good',
    'dev': 'Good'
  };
  
  return tldRatings[tld] || 'Average';
}

// Helper function to rate character count
function getCharacterCountRating(count) {
  if (count <= 4) return 'Excellent';
  if (count <= 6) return 'Very Good';
  if (count <= 10) return 'Good';
  if (count <= 15) return 'Average';
  return 'Below Average';
}

// Helper function to estimate pronounceability
function getPronounceabilityScore(name) {
  // Simple heuristic: count vowels and consonant clusters
  const vowels = (name.match(/[aeiou]/gi) || []).length;
  const consonantClusters = (name.match(/[bcdfghjklmnpqrstvwxyz]{3,}/gi) || []).length;
  
  const vowelRatio = vowels / name.length;
  
  if (consonantClusters >= 2) return 'Difficult';
  if (consonantClusters === 1 && vowelRatio < 0.3) return 'Moderate';
  if (vowelRatio < 0.2) return 'Moderate';
  if (vowelRatio > 0.5) return 'Easy';
  
  return 'Good';
} 