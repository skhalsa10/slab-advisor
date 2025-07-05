# Ximilar API Research Report

## Current Implementation vs Documentation

### Current Implementation (in our code):
```typescript
Endpoint: https://api.ximilar.com/recognition/v2/card-grading/detect
Method: POST
Headers: 
  - Authorization: Token ${API_KEY}
  - Content-Type: application/json
Body: {
  records: [
    { _url: "front_image_url", _key: "front" },
    { _url: "back_image_url", _key: "back" }
  ]
}
```

### Documentation Suggests:
```
Endpoint: /v2/grade (or possibly https://api.ximilar.com/collectibles/v2/grade)
Method: POST
Authentication: Token-based (matches our implementation)
```

## Key Findings:

1. **Endpoint Mismatch**: Our code uses `/recognition/v2/card-grading/detect` but docs show `/v2/grade`

2. **Documentation Gaps**: 
   - No specific request/response format examples
   - No clear base URL structure
   - Missing implementation details

3. **Authentication**: Our Token-based auth appears correct

## Recommendations:

### Option 1: Test Current Implementation
- Try current endpoint to see if it works
- May be legacy or undocumented endpoint

### Option 2: Update to Documented Endpoint
- Change to `/v2/grade` 
- May need to adjust request format

### Option 3: Contact Ximilar Support
- Email: tech@ximilar.com
- Get official API documentation

## Action Plan:

1. **First**: Test current implementation with real API key
2. **If fails**: Try documented `/v2/grade` endpoint
3. **If still fails**: Contact Ximilar support for correct documentation

## ✅ Status: RESOLVED

### SOLUTION FOUND:
**Correct Endpoint**: `https://api.ximilar.com/card-grader/v2/grade`

### Test Results:
```bash
curl -X POST "https://api.ximilar.com/card-grader/v2/grade" \
  -H "Authorization: Token API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"records": [{"_url": "image_url", "_key": "front"}]}'
```

**Response Format**:
```json
{
  "records": [
    {
      "_key": "front",
      "_status": {"code": 200, "text": "OK"},
      "grades": {
        "final": 3.5,
        "condition": "Very Good",
        "corners": 1.0,
        "edges": 5.5,
        "surface": 3.5,
        "centering": 8.0
      }
    }
  ]
}
```

### Implementation Updated:
- ✅ Endpoint changed to `/card-grader/v2/grade`
- ✅ Response parsing updated for new format
- ✅ Handles both successful and failed card detection
- ✅ Preserves detailed grading breakdown