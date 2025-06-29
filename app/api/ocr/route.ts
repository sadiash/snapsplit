import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mindeeApiKey = process.env.MINDEE_API_KEY;
    if (!mindeeApiKey) {
      return NextResponse.json({ error: 'OCR service not configured' }, { status: 500 });
    }

    // Prepare form data for Mindee - exact field name and structure
    const mindeeFormData = new FormData();
    mindeeFormData.append('document', file);

    // Exact URL as specified - no trailing slash, no typos
    const response = await fetch('https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${mindeeApiKey}`,
      },
      body: mindeeFormData,
    });

    if (!response.ok) {
      console.error('Mindee API Error - Status:', response.status);
      console.error('Mindee API Error - Headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is JSON before trying to parse
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.json();
          console.error('Mindee API Error - JSON:', errorData);
        } catch (jsonError) {
          console.error('Failed to parse error JSON:', jsonError);
        }
      } else {
        const textResponse = await response.text();
        console.error('Mindee API Error - Text:', textResponse);
      }
      
      return NextResponse.json({ error: 'OCR service error' }, { status: 500 });
    }

    // Safely parse JSON response with proper error handling
    let result;
    try {
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Expected JSON but got:', contentType, textResponse);
        return NextResponse.json({ error: 'OCR service error' }, { status: 500 });
      }
      
      result = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse Mindee response as JSON:', jsonError);
      return NextResponse.json({ error: 'OCR service error' }, { status: 500 });
    }
    
    // Extract data from Mindee response
    const prediction = result.document?.inference?.prediction;
    
    if (!prediction) {
      console.error('Invalid Mindee response structure:', result);
      return NextResponse.json({ error: 'OCR service error' }, { status: 500 });
    }
    
    const vendor = prediction.supplier_name?.value || 'Unknown Vendor';
    const total = prediction.total_amount?.value || 0;
    const confidence = prediction.total_amount?.confidence || 0;
    
    // Extract line items
    const items = prediction.line_items?.map((item: any) => ({
      text: item.description || 'Unknown Item',
      price: item.total_amount || 0,
      is_shared: false,
      assigned_to: [],
    })) || [];

    // If no line items, create a single item with the total
    if (items.length === 0 && total > 0) {
      items.push({
        text: 'Total Amount',
        price: total,
        is_shared: false,
        assigned_to: [],
      });
    }

    return NextResponse.json({
      vendor,
      total,
      items,
      confidence,
      raw_response: result,
    });

  } catch (error) {
    console.error('OCR API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}