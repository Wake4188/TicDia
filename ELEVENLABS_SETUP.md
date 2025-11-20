# ElevenLabs Text-to-Speech Setup Guide

## 🔧 Issue Fixed
The TTS feature was failing because:
1. ❌ Missing authentication header in API requests
2. ❌ ElevenLabs API key not configured in Supabase

## ✅ Code Fix Applied
Updated `src/services/textToSpeechService.ts` to:
- Add authentication header to all TTS requests
- Check for user session before making requests
- Provide clear error messages

## 🔑 Required: Set Up ElevenLabs API Key

### Step 1: Get Your ElevenLabs API Key

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up or log in
3. Navigate to your **Profile Settings**
4. Copy your **API Key**

**Free Tier Limits:**
- 10,000 characters/month
- Standard voices
- Good for testing

**Paid Plans** (if needed):
- Starter: $5/month - 30,000 characters
- Creator: $22/month - 100,000 characters
- Pro: $99/month - 500,000 characters

### Step 2: Add API Key to Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **rtuxaekhfwvpwmvmdaul**
3. Navigate to **Settings** → **Edge Functions**
4. Click on **Secrets** or **Environment Variables**
5. Add a new secret:
   - **Name**: `ELEVENLABS_API_KEY`
   - **Value**: Your ElevenLabs API key (starts with `sk_...`)
6. Click **Save**

### Step 3: Redeploy Edge Function (if needed)

The edge function should automatically pick up the new environment variable. If it doesn't work immediately:

1. Go to **Edge Functions** in Supabase
2. Find `text-to-speech` function
3. Click **Redeploy** or **Deploy**

## 🧪 Testing

After setting up the API key:

1. **Log in** to your TicDia account (TTS requires authentication)
2. Navigate to any article
3. Click the **Play** button (🎵 Listen)
4. Audio should start playing within 2-3 seconds

### Expected Behavior:
- ✅ Loading spinner appears
- ✅ Audio plays automatically
- ✅ Volume controls work
- ✅ Mute/unmute works

### If It Still Doesn't Work:

**Check Browser Console:**
```javascript
// Look for errors like:
// - "Authentication required" → User not logged in
// - "ElevenLabs API key not configured" → Key not set in Supabase
// - "Rate limit exceeded" → Too many requests (20/minute limit)
// - "ElevenLabs API error" → Invalid API key or quota exceeded
```

**Verify API Key:**
```bash
# Test your API key directly (replace YOUR_API_KEY)
curl -X POST https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "model_id": "eleven_multilingual_v2"}' \
  --output test.mp3
```

## 📊 Usage Limits

The edge function has built-in rate limiting:
- **20 requests per minute** per user
- **2,500 characters** per request (auto-truncated)

## 🎯 Supported Voices

Default voice: `pNInz6obpgDQGcFmaJgB` (Adam - English)

To use different voices, you can modify the request in `AudioPlayer.tsx`:
```typescript
const blob = await fetchTTSBlob(text, { voice: 'VOICE_ID_HERE' });
```

Popular voice IDs:
- `pNInz6obpgDQGcFmaJgB` - Adam (English, Male)
- `EXAVITQu4vr4xnSDxMaL` - Bella (English, Female)
- `ErXwobaYiN019PkySvjV` - Antoni (English, Male)

## 🔒 Security Notes

- ✅ API key is stored securely in Supabase (server-side only)
- ✅ Authentication required for all TTS requests
- ✅ Rate limiting prevents abuse
- ✅ Text is truncated to 2,500 characters max

## 💡 Alternative: Use Your Own API Key

If you want to use TTS without Supabase edge functions, you can:

1. Get your ElevenLabs API key
2. Call the API directly from the frontend
3. Update `textToSpeechService.ts` to use direct API calls

**Note:** This exposes your API key in the frontend (not recommended for production).

## 📞 Support

If you're still having issues:
1. Check Supabase Edge Function logs
2. Verify your ElevenLabs account has available quota
3. Ensure you're logged in to TicDia
4. Check browser console for detailed error messages

---

**Status:** ✅ Code fixed, awaiting API key configuration
