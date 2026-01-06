export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { idea } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  console.log('🔧 Backend: Received request for idea');
  console.log('🔑 API Key available:', apiKey ? '✅ Yes' : '❌ No');

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set in environment variables');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  if (!idea || idea.trim() === '') {
    console.warn('⚠️ Empty idea received');
    return res.status(400).json({ error: 'Idea is required' });
  }

  const systemPrompt = `You are an expert CTO for a software agency. 
  User will provide an app idea. You must generate a technical blueprint JSON.
  Structure:
  {
      "title": "Creative App Name",
      "tagline": "Short punchy pitch",
      "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
      "techStack": ["Framework", "Language", "Database", "Service"],
      "monetization": "One sentence business model"
  }`;

  const userPrompt = `Create a blueprint for this idea: ${idea}`;

  try {
    console.log('🔄 Backend: Calling Gemini API...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    console.log('📥 Backend: Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Gemini API error:', errorData);
      return res.status(response.status).json({ error: `Gemini API error: ${response.status}` });
    }

    const data = await response.json();
    console.log('✅ Backend: Gemini response received');
    
    const aiResponse = JSON.parse(data.candidates[0].content.parts[0].text);
    console.log('🎯 Backend: Parsed response:', aiResponse);
    
    return res.status(200).json(aiResponse);

  } catch (error) {
    console.error('💥 Backend error:', error.message);
    console.error('Full error:', error);
    return res.status(500).json({ error: `Failed to generate blueprint: ${error.message}` });
  }
}
