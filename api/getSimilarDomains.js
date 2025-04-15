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

    // Parse the domain to get name and TLD
    const domainParts = domain.split('.');
    const name = domainParts[0];
    const tld = domainParts.length > 1 ? domainParts[1] : 'com';

    // In a real app, you might use a domain registrar API here
    // For this demo, we'll use OpenAI to generate similar domains
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a domain name suggestion API that finds similar, available, and 
          relevant domain names based on a given domain. Generate plausible similar domains 
          with realistic pricing. Respond ONLY with JSON data.`
        },
        {
          role: "user",
          content: `Generate 8-12 similar domain names to "${domain}" with these characteristics:
          1. Mix of similar TLDs and alternate names
          2. Include logical variations, synonyms, and brandable alternatives
          3. Each domain should have a realistic price estimate based on length, keywords, and TLD
          4. Prices should be appropriate (shorter domains cost more, premium TLDs cost more)
          
          Format the response as JSON:
          {
            "domains": [
              {"name": "domain-name.tld", "price": number},
              ...
            ]
          }
          
          For pricing guidelines:
          - Short .com domains (3-5 chars): $5,000-$50,000
          - Medium .com domains (6-10 chars): $1,000-$5,000
          - Longer .com domains: $500-$2,000
          - Premium TLDs (.io, .ai, etc): 60-80% of .com price
          - Other TLDs (.net, .org): 30-50% of .com price`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    try {
      const similarDomainsData = JSON.parse(completion.choices[0].message.content);
      
      // Ensure we have the domains array
      if (!similarDomainsData.domains || !Array.isArray(similarDomainsData.domains)) {
        throw new Error('Invalid response format');
      }
      
      // Sort by price (highest first)
      similarDomainsData.domains.sort((a, b) => b.price - a.price);
      
      return res.status(200).json(similarDomainsData);
    } catch (parseError) {
      console.error('Error parsing similar domains data:', parseError);
      
      // Fallback to generated data if parsing fails
      return res.status(200).json({
        domains: generateFallbackSimilarDomains(domain)
      });
    }
  } catch (error) {
    console.error('Error getting similar domains:', error);
    return res.status(500).json({ error: 'Failed to get similar domains' });
  }
}

// Generate fallback similar domains if OpenAI doesn't return proper JSON
function generateFallbackSimilarDomains(domain) {
  const domainParts = domain.split('.');
  const name = domainParts[0];
  const tld = domainParts.length > 1 ? domainParts[1] : 'com';
  
  const commonTlds = ['com', 'net', 'org', 'io', 'co', 'app', 'dev', 'ai'];
  const prefixes = ['get', 'try', 'my', 'best', 'top', 'pro', 'go'];
  const suffixes = ['app', 'hub', 'spot', 'zone', 'pro', 'hq', 'now'];
  
  const similarDomains = [];
  
  // Same name with different TLDs
  for (let i = 0; i < 3; i++) {
    const newTld = commonTlds[Math.floor(Math.random() * commonTlds.length)];
    if (newTld !== tld) {
      const price = calculateDomainPrice(name, newTld);
      similarDomains.push({
        name: `${name}.${newTld}`,
        price: price
      });
    }
  }
  
  // Name with prefix
  for (let i = 0; i < 2; i++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const newTld = commonTlds[Math.floor(Math.random() * commonTlds.length)];
    const newDomain = `${prefix}${name}`;
    const price = calculateDomainPrice(newDomain, newTld);
    similarDomains.push({
      name: `${newDomain}.${newTld}`,
      price: price
    });
  }
  
  // Name with suffix
  for (let i = 0; i < 2; i++) {
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const newTld = commonTlds[Math.floor(Math.random() * commonTlds.length)];
    const newDomain = `${name}${suffix}`;
    const price = calculateDomainPrice(newDomain, newTld);
    similarDomains.push({
      name: `${newDomain}.${newTld}`,
      price: price
    });
  }
  
  // Add some with similar patterns
  const vowels = 'aeiou';
  if (name.length > 3) {
    // Swap a vowel
    for (let i = 0; i < name.length; i++) {
      if (vowels.includes(name[i])) {
        const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
        const newName = name.substring(0, i) + randomVowel + name.substring(i + 1);
        const newTld = commonTlds[Math.floor(Math.random() * commonTlds.length)];
        const price = calculateDomainPrice(newName, newTld);
        similarDomains.push({
          name: `${newName}.${newTld}`,
          price: price
        });
        break;
      }
    }
    
    // Add a character
    const position = Math.floor(Math.random() * (name.length - 1)) + 1;
    const randomChar = 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    const newName = name.substring(0, position) + randomChar + name.substring(position);
    const newTld = commonTlds[Math.floor(Math.random() * commonTlds.length)];
    const price = calculateDomainPrice(newName, newTld);
    similarDomains.push({
      name: `${newName}.${newTld}`,
      price: price
    });
  }
  
  // Sort by price (highest first)
  return similarDomains.sort((a, b) => b.price - a.price);
}

// Calculate a realistic domain price based on length and TLD
function calculateDomainPrice(name, tld) {
  const length = name.length;
  let basePrice;
  
  // Base price by length
  if (length <= 3) basePrice = 10000 + Math.random() * 40000;
  else if (length <= 5) basePrice = 5000 + Math.random() * 10000;
  else if (length <= 8) basePrice = 1000 + Math.random() * 4000;
  else if (length <= 12) basePrice = 500 + Math.random() * 1000;
  else basePrice = 200 + Math.random() * 300;
  
  // TLD multiplier
  let tldMultiplier;
  if (tld === 'com') tldMultiplier = 1;
  else if (['io', 'ai', 'app'].includes(tld)) tldMultiplier = 0.7;
  else if (['co', 'dev'].includes(tld)) tldMultiplier = 0.5;
  else if (['net', 'org'].includes(tld)) tldMultiplier = 0.4;
  else tldMultiplier = 0.3;
  
  // Calculate final price
  return Math.round(basePrice * tldMultiplier);
} 