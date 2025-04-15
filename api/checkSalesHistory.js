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

    // Extract domain parts for analysis
    const domainParts = domain.split('.');
    const name = domainParts[0];
    const tld = domainParts.length > 1 ? domainParts[1] : 'com';

    // In a real application, you would query a domain sales database
    // For this demo, we'll use OpenAI to generate plausible sales history
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a domain name sales history database. Generate a plausible and 
          realistic sales history for the given domain name. Consider the domain's characteristics 
          (length, keywords, TLD) to inform the sales history. Respond ONLY with JSON data.`
        },
        {
          role: "user",
          content: `Generate a plausible sales history for the domain name "${domain}". 
          Format the response as JSON with an array of sales objects, each with a date and price.
          Consider the domain's value based on its length, keywords, and TLD.
          If it's a premium domain (short, brandable, .com), show higher prices.
          Response format:
          {
            "sales": [
              {"date": "YYYY-MM-DD", "price": number},
              ...
            ]
          }
          Include between 0-5 sales depending on how likely this domain would have been sold before.
          Dates should be in the past. More recent sales can have higher prices to show appreciation.`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    try {
      const salesData = JSON.parse(completion.choices[0].message.content);
      
      // Format dates and sort by date
      if (salesData.sales && Array.isArray(salesData.sales)) {
        salesData.sales = salesData.sales
          .map(sale => {
            // Format date to be more readable
            const dateObj = new Date(sale.date);
            return {
              ...sale,
              date: dateObj.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            };
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      return res.status(200).json(salesData);
    } catch (parseError) {
      console.error('Error parsing sales data:', parseError);
      
      // Fallback to generated data if parsing fails
      return res.status(200).json({
        sales: generateFallbackSalesData(domain)
      });
    }
  } catch (error) {
    console.error('Error checking sales history:', error);
    return res.status(500).json({ error: 'Failed to check sales history' });
  }
}

// Generate fallback sales data if OpenAI doesn't return proper JSON
function generateFallbackSalesData(domain) {
  const domainLength = domain.length;
  const isComDomain = domain.endsWith('.com');
  
  // Determine number of sales based on domain characteristics
  let numSales = 0;
  
  if (domainLength <= 5) {
    numSales = isComDomain ? 3 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
  } else if (domainLength <= 10) {
    numSales = isComDomain ? 1 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2);
  } else {
    numSales = Math.random() > 0.7 ? 1 : 0;
  }
  
  if (numSales === 0) {
    return [];
  }
  
  const sales = [];
  const currentYear = new Date().getFullYear();
  
  // Base price determination
  let basePrice = 0;
  if (domainLength <= 4 && isComDomain) basePrice = 10000 + Math.random() * 90000;
  else if (domainLength <= 6 && isComDomain) basePrice = 5000 + Math.random() * 15000;
  else if (domainLength <= 10 && isComDomain) basePrice = 1000 + Math.random() * 4000;
  else if (isComDomain) basePrice = 500 + Math.random() * 1500;
  else basePrice = 200 + Math.random() * 800;
  
  // Generate sales
  for (let i = 0; i < numSales; i++) {
    const yearsAgo = Math.floor(Math.random() * 10) + (i * 2);
    const saleYear = currentYear - yearsAgo;
    const saleMonth = Math.floor(Math.random() * 12) + 1;
    const saleDay = Math.floor(Math.random() * 28) + 1;
    
    const date = new Date(saleYear, saleMonth - 1, saleDay);
    const formattedDate = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Older sales are typically lower
    const priceMultiplier = 0.7 + (i / numSales) * 0.5;
    const price = Math.round(basePrice * priceMultiplier);
    
    sales.push({
      date: formattedDate,
      price: price
    });
  }
  
  // Sort by date, most recent first
  return sales.sort((a, b) => new Date(b.date) - new Date(a.date));
} 