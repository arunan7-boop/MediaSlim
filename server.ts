import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { Storage } from '@google-cloud/storage';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Increase payload limit for base64 image inspection
  app.use(express.json({ limit: '25mb' }));

  // Gemini AI Initialization
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  // Smart AI Compression Analysis API Endpoint
  app.post('/api/analyze-compression', async (req, res) => {
    try {
      const { imageBase64, mimeType, fileName, fileSize, width, height } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Missing image data' });
      }

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const promptText = `Analyze this image for visual complexity and target compression settings. 
Filename: ${fileName || 'image'}, Original Dimensions: ${width || 'unknown'}x${height || 'unknown'}, Original Size: ${fileSize ? Math.round(fileSize / 1024) + ' KB' : 'unknown'}.

Evaluate whether the image contains high text/sharp vector detail (requires higher quality ~80-88%), smooth gradients or natural photos (~65-75%), or solid blocks of simple shapes/diagrams (~50-65%).

Suggest:
1. Optimal target quality percentage (integer from 30 to 95).
2. Suggested output format ('webp', 'jpeg', 'png', or 'avif').
3. Complexity level ('Low', 'Medium', or 'High').
4. Brief 1-sentence reasoning explaining why this quality setting minimizes file size without noticeable visual loss.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'image/jpeg'
              }
            },
            {
              text: promptText
            }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedQuality: {
                type: Type.INTEGER,
                description: 'Recommended target compression quality percentage (30 to 95)'
              },
              suggestedFormat: {
                type: Type.STRING,
                description: 'Recommended format: webp, jpeg, png, or avif'
              },
              complexityLevel: {
                type: Type.STRING,
                description: 'High, Medium, or Low visual detail complexity'
              },
              reasoning: {
                type: Type.STRING,
                description: 'A 1-sentence concise explanation of why this setting is optimal'
              }
            },
            required: ['suggestedQuality', 'suggestedFormat', 'complexityLevel', 'reasoning']
          }
        }
      });

      const jsonText = response.text || '{}';
      const result = JSON.parse(jsonText);

      return res.json({
        success: true,
        analysis: result
      });
    } catch (err: any) {
      console.error('Gemini Analysis Error:', err);
      return res.status(500).json({
        error: 'Failed to analyze image with AI',
        details: err?.message || String(err)
      });
    }
  });

  // Cloud Run & Infrastructure Health API
  app.get('/api/cloud-run/status', (req, res) => {
    const cloudflareRay = req.headers['cf-ray'] || 'simulated-cf-ray-8f921';
    const cloudflareIp = req.headers['cf-connecting-ip'] || req.ip || '127.0.0.1';
    
    res.json({
      service: 'Cloud Run Container Service',
      status: 'active',
      port: PORT,
      region: process.env.K_LOCATION || 'us-central1',
      containerId: process.env.K_REVISION || 'mediaslim-revision-v1',
      memoryLimit: '1024MB',
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      cloudflareProxy: {
        active: true,
        cfRay: cloudflareRay,
        clientIp: cloudflareIp,
        cacheControl: 'public, max-age=31536000, immutable'
      },
      gcsIntegration: {
        bucket: process.env.GCS_BUCKET_NAME || 'mediaslim-vault-bucket',
        provider: 'Google Cloud Storage (GCS)',
        status: 'ready'
      }
    });
  });

  // Google Cloud Storage Bucket Status & Presigned URL Generator Endpoint
  app.get('/api/gcs/config', (req, res) => {
    res.json({
      provider: 'Google Cloud Storage (GCS)',
      bucket: process.env.GCS_BUCKET_NAME || 'mediaslim-vault-bucket',
      region: process.env.GCS_REGION || 'us-central1',
      cloudflareDomain: process.env.CLOUDFLARE_DOMAIN || 'cdn.mediaslim.app',
      cdnProxyEnabled: true,
      corsAllowedOrigins: ['*']
    });
  });

  app.post('/api/gcs/upload-url', async (req, res) => {
    try {
      const { fileName, contentType } = req.body;
      if (!fileName) return res.status(400).json({ error: 'Missing fileName' });
      
      const storage = new Storage();
      const bucketName = process.env.GCS_BUCKET_NAME || 'mediaslim-vault-bucket';
      const file = storage.bucket(bucketName).file(fileName);
      
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: contentType || 'application/octet-stream',
      });
      
      res.json({ success: true, url, bucket: bucketName });
    } catch (error: any) {
      console.error('Error generating presigned URL:', error);
      res.status(500).json({ error: 'Failed to generate upload URL', details: error.message });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
