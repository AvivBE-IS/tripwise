const { validationResult } = require('express-validator');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const generateItinerary = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      destination,
      duration,
      budget,
      interests = [],
      travelStyle = 'mid-range',
      groupSize = 1
    } = req.body;

    // Create the prompt for OpenAI
    const prompt = `Create a detailed travel itinerary for ${destination} for ${duration} days. 
    
Travel details:
- Budget: ${budget ? `$${budget}` : 'Not specified'}
- Travel style: ${travelStyle}
- Group size: ${groupSize}
- Interests: ${interests.length > 0 ? interests.join(', ') : 'General sightseeing'}

Please provide a structured JSON response with the following format:
{
  "itinerary": {
    "destination": "string",
    "totalDays": number,
    "estimatedBudget": number,
    "currency": "USD",
    "days": [
      {
        "dayNumber": number,
        "date": "YYYY-MM-DD", 
        "title": "string",
        "theme": "string",
        "stops": [
          {
            "title": "string",
            "description": "string",
            "address": "string",
            "latitude": number,
            "longitude": number,
            "stopType": "attraction|restaurant|hotel|transport|activity|shopping",
            "startTime": "HH:MM",
            "endTime": "HH:MM",
            "durationMinutes": number,
            "estimatedCost": number,
            "tips": "string"
          }
        ]
      }
    ],
    "tips": ["string"],
    "packingRecommendations": ["string"]
  }
}

Make sure all coordinates are accurate and all times are realistic. Include a mix of attractions, restaurants, and activities based on the interests provided.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional travel planner. Always respond with valid JSON in the exact format requested. Ensure all data is accurate and realistic.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });

      const aiResponse = completion.choices[0].message.content;
      const itineraryData = JSON.parse(aiResponse);

      res.json({
        success: true,
        itinerary: itineraryData.itinerary,
        usage: {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        }
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Fallback response if OpenAI fails
      const fallbackItinerary = createFallbackItinerary(destination, duration);
      res.json({
        success: true,
        itinerary: fallbackItinerary,
        warning: 'AI service unavailable, using fallback itinerary'
      });
    }
  } catch (error) {
    console.error('Generate itinerary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const suggestActivities = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { location, activityType = 'attraction', budget = 'medium' } = req.body;

    const prompt = `Suggest 5 ${activityType}s in ${location} for a ${budget} budget. 

Please provide a JSON response with the following format:
{
  "suggestions": [
    {
      "title": "string",
      "description": "string", 
      "address": "string",
      "latitude": number,
      "longitude": number,
      "estimatedCost": number,
      "duration": "string",
      "rating": number,
      "tips": "string"
    }
  ]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a local travel expert. Always respond with valid JSON and accurate information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const aiResponse = completion.choices[0].message.content;
      const suggestionsData = JSON.parse(aiResponse);

      res.json({
        success: true,
        suggestions: suggestionsData.suggestions
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      res.status(503).json({ 
        message: 'AI suggestion service temporarily unavailable',
        suggestions: []
      });
    }
  } catch (error) {
    console.error('Suggest activities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fallback itinerary when OpenAI is unavailable
const createFallbackItinerary = (destination, duration) => {
  const baseDate = new Date();
  const days = [];

  for (let i = 0; i < duration; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    days.push({
      dayNumber: i + 1,
      date: date.toISOString().split('T')[0],
      title: `Day ${i + 1} in ${destination}`,
      theme: i === 0 ? 'Arrival & Exploration' : i === duration - 1 ? 'Final Day' : 'Exploration',
      stops: [
        {
          title: `Main Attraction in ${destination}`,
          description: 'Popular tourist destination',
          address: `${destination} city center`,
          latitude: 0,
          longitude: 0,
          stopType: 'attraction',
          startTime: '09:00',
          endTime: '11:00',
          durationMinutes: 120,
          estimatedCost: 20,
          tips: 'Book tickets in advance'
        },
        {
          title: `Local Restaurant`,
          description: 'Traditional cuisine',
          address: `${destination} restaurant district`,
          latitude: 0,
          longitude: 0,
          stopType: 'restaurant',
          startTime: '12:00',
          endTime: '13:30',
          durationMinutes: 90,
          estimatedCost: 25,
          tips: 'Try the local specialties'
        }
      ]
    });
  }

  return {
    destination,
    totalDays: duration,
    estimatedBudget: duration * 75,
    currency: 'USD',
    days,
    tips: [
      'Check local weather before departure',
      'Learn basic local phrases',
      'Keep important documents safe'
    ],
    packingRecommendations: [
      'Comfortable walking shoes',
      'Weather-appropriate clothing',
      'Portable charger',
      'Travel adapter'
    ]
  };
};

module.exports = {
  generateItinerary,
  suggestActivities
};