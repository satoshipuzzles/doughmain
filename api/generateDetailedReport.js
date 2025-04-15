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

    console.log(`Generating detailed report for domain: ${domain}`);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in domain name valuation, branding, and digital marketing. 
          You have 15+ years of experience in domain acquisitions and sales.
          Provide detailed, data-driven analysis with specific recommendations and numerical values 
          whenever possible. Format your response with clear headings and bullet points.`
        },
        {
          role: "user",
          content: `Generate a comprehensive analysis for the domain "${domain}". Include:
          
          1. Market Analysis: What industry sectors would find this domain valuable and why
          2. Comparative Value: How this compares to similar domains on the market
          3. SEO Potential: Keyword analysis, search volume potential, and organic traffic value
          4. Branding Potential: Target audience identification and brand fit
          5. Development ROI: Estimated return on investment for development vs resale
          6. Investment Outlook: Short-term and long-term value projections with estimated numbers
          7. Best Use Case: Recommendations for highest value application of this domain
          8. Risk Assessment: Potential challenges or limitations of this domain
          9. Marketing Strategy: How to position this domain for maximum value
          10. Value Assessment: Estimated monetary value range with detailed factors considered
          
          Provide specific numerical values and metrics whenever possible.`
        }
      ],
      temperature: 0.5,
      max_tokens: 2500,
    });

    const analysis = completion.choices[0].message.content;
    
    // Try to extract numerical values from the analysis
    const valueRangeMatch = analysis.match(/\$\s*[\d,]+\s*-\s*\$\s*[\d,]+/);
    const valueRange = valueRangeMatch 
      ? valueRangeMatch[0].replace(/[^0-9\-]/g, '') 
      : (nameOnly.length < 6 ? '5000-25000' : (nameOnly.length < 10 ? '1000-5000' : '500-2000'));
    
    const [minValue, maxValue] = valueRange.split('-').map(v => parseInt(v.trim(), 10));
    const avgValue = Math.round((minValue + maxValue) / 2);
    
    // Generate traffic estimates based on domain characteristics
    const trafficEstimate = generateTrafficEstimate(nameOnly, tld);
    
    // Generate additional metrics for the detailed report
    const metrics = {
      "Estimated Value": `$${avgValue.toLocaleString()}`,
      "Value Range": `$${minValue.toLocaleString()} - $${maxValue.toLocaleString()}`,
      "Traffic Potential": `${trafficEstimate.monthly.toLocaleString()} visits/month`,
      "Annual Revenue Potential": `$${trafficEstimate.revenue.toLocaleString()}`,
      "Domain Age Potential": `${Math.floor(Math.random() * 5) + 1}/5`,
      "Development ROI": `${(Math.random() * 4 + 1).toFixed(1)}x`,
      "Investment Grade": getInvestmentGrade(domain),
      "Market Demand": `${Math.floor(Math.random() * 5) + 1}/5`,
      "Keyword Value": `$${(Math.random() * 2 + 0.5).toFixed(2)}/click`,
      "TLD Strength": getTldStrength(tld),
      "Character Count": `${nameOnly.length} (${getCharacterCountRating(nameOnly.length)})`,
      "Pronounceability": getPronounceabilityScore(nameOnly),
      "Brandability": getBrandabilityScore(nameOnly),
      "Memorability": getMemorabilityScore(nameOnly)
    };

    // Generate a more detailed market analysis
    const marketAnalysis = {
      "Industries": generateRelevantIndustries(nameOnly),
      "Competing Domains": generateCompetingDomains(nameOnly, tld),
      "Growth Trend": getGrowthTrend(nameOnly),
      "Global Appeal": getGlobalAppeal(nameOnly),
      "Digital Marketing Value": getDigitalMarketingValue(nameOnly, tld)
    };

    return res.status(200).json({
      title: `Detailed Analysis: ${domain}`,
      content: analysis,
      metrics: metrics,
      marketAnalysis: marketAnalysis
    });
  } catch (error) {
    console.error('Error generating detailed report:', error);
    return res.status(500).json({ 
      error: 'Failed to generate detailed report',
      message: error.message 
    });
  }
}

// Generate traffic and revenue estimates
function generateTrafficEstimate(name, tld) {
  const baseTraffic = Math.floor(Math.random() * 500) + 100;
  const tldMultiplier = tld === 'com' ? 2 : (tld === 'org' || tld === 'net' ? 1.5 : 1);
  const lengthMultiplier = name.length < 6 ? 3 : (name.length < 10 ? 2 : 1);
  
  const monthlyTraffic = Math.floor(baseTraffic * tldMultiplier * lengthMultiplier);
  const annualRevenue = monthlyTraffic * 12 * (Math.random() * 0.5 + 0.2); // $0.20-$0.70 per visit
  
  return {
    monthly: monthlyTraffic,
    annual: monthlyTraffic * 12,
    revenue: Math.floor(annualRevenue)
  };
}

// Generate relevant industries for the domain
function generateRelevantIndustries(name) {
  const industries = {
    tech: ["tech", "app", "soft", "web", "net", "code", "dev", "data", "ai", "cloud", "cyber", "digital"],
    finance: ["fin", "bank", "pay", "money", "cash", "wealth", "invest", "capital", "fund", "trade", "crypto"],
    health: ["health", "med", "care", "well", "fit", "nutri", "life", "bio", "pharma", "therapy"],
    education: ["edu", "learn", "teach", "school", "acad", "train", "skill", "tutor", "course"],
    ecommerce: ["shop", "store", "buy", "sell", "market", "deal", "commerce", "retail", "price", "goods"],
    travel: ["travel", "trip", "tour", "visit", "journey", "vacation", "flight", "hotel", "book", "adventure"],
    food: ["food", "eat", "meal", "recipe", "cook", "chef", "dish", "taste", "kitchen", "restaurant", "cafe"]
  };
  
  let relevantIndustries = [];
  
  // Check each industry for keyword matches
  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some(keyword => name.toLowerCase().includes(keyword))) {
      relevantIndustries.push(industry);
    }
  }
  
  // If no specific industry matches, pick 2-3 random ones that might fit
  if (relevantIndustries.length === 0) {
    const allIndustries = Object.keys(industries);
    const numIndustries = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < numIndustries; i++) {
      const randomIndustry = allIndustries[Math.floor(Math.random() * allIndustries.length)];
      if (!relevantIndustries.includes(randomIndustry)) {
        relevantIndustries.push(randomIndustry);
      }
    }
  }
  
  // Format the industry names for display
  return relevantIndustries.map(industry => {
    const capitalizedIndustry = industry.charAt(0).toUpperCase() + industry.slice(1);
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-99%
    return `${capitalizedIndustry} (${confidence}% fit)`;
  });
}

// Generate competing domains
function generateCompetingDomains(name, tld) {
  const domains = [];
  const tlds = ['com', 'net', 'org', 'io', 'co', 'app'];
  const prefixes = ['get', 'my', 'try', 'go', 'best'];
  const suffixes = ['app', 'hub', 'pro', 'site', 'now'];
  
  // Add some with same name but different TLDs
  for (let i = 0; i < 2; i++) {
    let newTld = tlds[Math.floor(Math.random() * tlds.length)];
    if (newTld !== tld) {
      domains.push(`${name}.${newTld}`);
    }
  }
  
  // Add some with prefixes/suffixes
  if (Math.random() > 0.5) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    domains.push(`${prefix}${name}.${tld}`);
  } else {
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    domains.push(`${name}${suffix}.${tld}`);
  }
  
  return domains;
}

// Get growth trend
function getGrowthTrend(name) {
  const trends = ["Stable", "Growing", "Rapidly Growing", "Emerging", "Mature", "Declining"];
  const weights = [0.2, 0.3, 0.2, 0.1, 0.1, 0.1]; // Different probabilities
  
  let random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < trends.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      return trends[i];
    }
  }
  
  return trends[0]; // Default to first option if something goes wrong
}

// Get global appeal rating
function getGlobalAppeal(name) {
  // Simple heuristic: shorter names tend to have more global appeal
  if (name.length <= 5) return "Excellent";
  if (name.length <= 8) return "Very Good";
  if (name.length <= 12) return "Good";
  return "Average";
}

// Get digital marketing value
function getDigitalMarketingValue(name, tld) {
  // Create a score from 1-100
  let score = 60; // Base score
  
  // Adjust by length (shorter is better)
  if (name.length <= 5) score += 20;
  else if (name.length <= 8) score += 10;
  else if (name.length > 12) score -= 10;
  
  // Adjust by TLD
  if (tld === 'com') score += 15;
  else if (tld === 'net' || tld === 'org') score += 5;
  else if (tld === 'io' || tld === 'app' || tld === 'ai') score += 8;
  
  // Random variation
  score += Math.floor(Math.random() * 20) - 10;
  
  // Clamp to 1-100
  score = Math.max(1, Math.min(100, score));
  
  return `${score}/100`;
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

// Helper function to rate brandability
function getBrandabilityScore(name) {
  let score = 70; // Base score
  
  // Length factor (5-8 characters is ideal for brands)
  if (name.length >= 5 && name.length <= 8) {
    score += 15;
  } else if (name.length > 12) {
    score -= 10;
  }
  
  // Pronounceability factor
  const vowels = (name.match(/[aeiou]/gi) || []).length;
  const vowelRatio = vowels / name.length;
  if (vowelRatio >= 0.3 && vowelRatio <= 0.6) {
    score += 10;
  }
  
  // No numbers or special characters is better for brands
  if (!/[0-9-_]/.test(name)) {
    score += 5;
  }
  
  // Add slight randomness
  score += Math.floor(Math.random() * 10) - 5;
  
  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));
  
  return `${score}/100`;
}

// Helper function to rate memorability
function getMemorabilityScore(name) {
  let score = 65; // Base score
  
  // Shorter is generally more memorable
  if (name.length <= 4) {
    score += 20;
  } else if (name.length <= 6) {
    score += 15;
  } else if (name.length <= 8) {
    score += 10;
  } else if (name.length > 12) {
    score -= 10;
  }
  
  // Simple words are more memorable
  if (/^[a-z]+$/i.test(name) && !/[0-9-_]/.test(name)) {
    score += 10;
  }
  
  // Add randomness
  score += Math.floor(Math.random() * 10) - 5;
  
  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));
  
  return `${score}/100`;
} 