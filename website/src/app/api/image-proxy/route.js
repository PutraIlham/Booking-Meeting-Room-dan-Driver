// app/api/image-proxy/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    // Get the path parameter from the URL
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');
    
    if (!imagePath) {
      return new NextResponse('Image path is required', { status: 400 });
    }
    
    // For security, verify this is a legitimate image path
    // Restrict to specific directories or paths
    if (!imagePath.includes('uploads') || imagePath.includes('..')) {
      return new NextResponse('Invalid image path', { status: 403 });
    }
    
    // Try to read the file
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Determine content type based on file extension
      const ext = path.extname(imagePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.jpg' || ext === '.jpeg') {
        contentType = 'image/jpeg';
      } else if (ext === '.png') {
        contentType = 'image/png';
      } else if (ext === '.gif') {
        contentType = 'image/gif';
      } else if (ext === '.webp') {
        contentType = 'image/webp';
      }
      
      // Return the image
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (error) {
      console.error('Error reading image file:', error);
      return new NextResponse('Image not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error in image proxy:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}