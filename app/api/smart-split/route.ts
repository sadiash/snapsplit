import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { items, participants, rule } = await request.json();

    if (!items || !participants || !rule) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'Smart split service not configured' }, { status: 500 });
    }

    const functions = [
      {
        name: 'applyRule',
        description: 'Apply a splitting rule to receipt items',
        parameters: {
          type: 'object',
          properties: {
            assignments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  item_index: { type: 'number' },
                  is_shared: { type: 'boolean' },
                  assigned_to: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                },
                required: ['item_index', 'is_shared', 'assigned_to'],
              },
            },
          },
          required: ['assignments'],
        },
      },
    ];

    const messages = [
      {
        role: 'system',
        content: `You are a smart expense splitting assistant. Apply the given rule to split receipt items among participants. 
        
        Rules:
        - If an item should be shared equally, set is_shared to true and include all participant IDs
        - If an item is for a specific person, set is_shared to false and include only their ID
        - Use common sense based on item descriptions and the rule provided
        
        Participants: ${participants.map((p: any) => `${p.id}: ${p.name}`).join(', ')}
        Items: ${items.map((item: any, index: number) => `${index}: ${item.text} - PKR ${item.price}`).join(', ')}`,
      },
      {
        role: 'user',
        content: `Apply this rule: "${rule}"`,
      },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        functions,
        function_call: { name: 'applyRule' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      return NextResponse.json({ error: 'Smart split processing failed' }, { status: 500 });
    }

    const result = await response.json();
    
    if (result.choices?.[0]?.message?.function_call) {
      const functionArgs = JSON.parse(result.choices[0].message.function_call.arguments);
      return NextResponse.json({
        assignments: functionArgs.assignments,
      });
    }

    return NextResponse.json({ error: 'No valid assignments generated' }, { status: 500 });

  } catch (error) {
    console.error('Smart Split API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}