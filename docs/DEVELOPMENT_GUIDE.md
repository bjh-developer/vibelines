# Vibelines Development Guide

## Overview

This guide provides comprehensive instructions for setting up, developing, and contributing to the Vibelines project. It covers everything from initial setup to deployment and troubleshooting.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Building and Testing](#building-and-testing)
6. [Deployment Guide](#deployment-guide)
7. [Environment Configuration](#environment-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Contributing Guidelines](#contributing-guidelines)
10. [Performance Optimization](#performance-optimization)

---

## Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+ (for backend)
- **Git** for version control
- **Spotify Developer Account** for API access
- **Supabase Account** for database

### 5-Minute Setup
```bash
# 1. Clone and install
git clone https://github.com/bjh-developer/vibelines.git
cd vibelines
npm install

# 2. Environment setup
cp .env.example .env.local
# Edit .env.local with your API keys (see Environment Configuration)

# 3. Start development server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

---

## Development Environment Setup

### Frontend Setup

#### System Requirements
```bash
# Verify Node.js version
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# For Windows users, also ensure:
# - Windows 10 version 1903 or higher
# - Windows Subsystem for Linux (WSL2) recommended
```

#### Installation Steps
```bash
# 1. Clone repository
git clone https://github.com/bjh-developer/vibelines.git
cd vibelines

# 2. Install dependencies
npm install

# 3. Install global development tools (optional)
npm install -g @vercel/cli
npm install -g typescript
npm install -g eslint

# 4. Verify installation
npm run build  # Should complete without errors
npm run lint   # Should pass all checks
```

#### Development Tools Setup

**VSCode Extensions (Recommended)**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "Gruntfuggly.todo-tree"
  ]
}
```

**VSCode Settings**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["className\\s*=\\s*[\"'`]([^\"'`]*)[\"'`]", "([^\"'`]*)"]
  ]
}
```

### Backend Setup

#### Python Environment
```bash
# 1. Navigate to backend directory
cd music2emotion_api

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
pip install -r api_requirements.txt

# 5. Verify installation
python -c "import torch; print(torch.__version__)"
python -c "import transformers; print(transformers.__version__)"
```

#### ML Model Setup
```bash
# Download required models (run from music2emotion_api directory)
mkdir -p saved_models

# Music2Emo model will be automatically downloaded on first run
# Or manually download from HuggingFace:
# git clone https://huggingface.co/amaai-lab/music2emo saved_models/music2emo
```

### Database Setup

#### Supabase Configuration
```sql
-- Run these SQL commands in your Supabase SQL editor

-- Enable Row Level Security
ALTER TABLE mood_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_timelines ENABLE ROW LEVEL SECURITY;

-- Create mood_analysis table
CREATE TABLE mood_analysis (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  song_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  predicted_moods TEXT[] NOT NULL,
  confidence_scores DECIMAL[] NOT NULL,
  deezer_track_id TEXT,
  preview_url TEXT,
  processing_time DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_timelines table
CREATE TABLE user_timelines (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  timeline_data JSONB NOT NULL,
  song_count INTEGER NOT NULL,
  chapter_count INTEGER NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_mood_analysis_user_id ON mood_analysis(user_id);
CREATE INDEX idx_mood_analysis_song_artist ON mood_analysis(song_name, artist_name);
CREATE INDEX idx_mood_analysis_created_at ON mood_analysis(created_at);
CREATE INDEX idx_user_timelines_user_id ON user_timelines(user_id);
CREATE INDEX idx_user_timelines_generated_at ON user_timelines(generated_at);

-- Row Level Security policies
CREATE POLICY "Users can view own mood analysis" ON mood_analysis
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own mood analysis" ON mood_analysis
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view own timelines" ON user_timelines
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own timelines" ON user_timelines
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own timelines" ON user_timelines
  FOR UPDATE USING (auth.uid()::text = user_id);
```

---

## Project Structure

### Frontend Structure
```
src/
├── components/              # Reusable UI components
│   ├── AuroraBG.tsx        # Animated background effect
│   ├── BubbleMenu.tsx      # Floating navigation menu
│   ├── ChapterCard.tsx     # Timeline card component
│   ├── SpotifyCallback.tsx # OAuth callback handler
│   ├── Stack.tsx           # Swipeable card container
│   ├── TextPressure.tsx    # Dynamic text effects
│   └── ui/                 # Shadcn/UI components
│       ├── button.tsx
│       ├── drawer.tsx
│       └── ...
├── hooks/                  # Custom React hooks
│   ├── useScreenSize.ts    # Screen dimension tracking
│   └── useScreenshot.ts    # Screenshot capture functionality
├── lib/                    # Utility libraries and configs
│   └── utils.ts           # Common utility functions
├── utils/                  # Business logic utilities
│   ├── deezerApi.ts       # Deezer API integration
│   ├── emotionApi.ts      # Music emotion analysis
│   ├── spotifyAuth.ts     # Spotify authentication
│   ├── supabaseClient.ts  # Database operations
│   └── viewTransitions.ts # Page transition effects
├── App.tsx                # Main application component
├── Loading.tsx            # Data processing page
├── MoodTimeline.tsx       # Timeline visualization
├── About.tsx              # About page
├── Contact.tsx            # Contact page
├── PrivacyPolicy.tsx      # Privacy policy page
├── FAQ.tsx                # FAQ page
└── main.tsx               # Application entry point
```

### Backend Structure
```
music2emotion_api/
├── config/                # Configuration files
│   ├── base_config.yaml   # Base model configuration
│   ├── train_config.yaml  # Training configuration
│   └── test_config.yaml   # Testing configuration
├── model/                 # ML model implementations
│   └── linear_mt_attn_ck.py # Music2Emo model
├── utils/                 # Utility modules
│   ├── btc_model.py       # Base model utilities
│   ├── hparams.py         # Hyperparameters
│   ├── mert.py            # MERT feature extraction
│   └── transformer_modules.py # Transformer components
├── saved_models/          # Pre-trained model weights
├── temp_out/              # Temporary processing files
├── api.py                 # FastAPI main application
├── music2emo.py           # Music emotion analysis core
├── requirements.txt       # Python dependencies
└── api_requirements.txt   # API-specific dependencies
```

### Configuration Files
```
/
├── package.json           # Node.js dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── tsconfig.app.json      # App-specific TypeScript config
├── tsconfig.node.json     # Node.js TypeScript config
├── vite.config.ts         # Vite build configuration
├── tailwind.config.js     # TailwindCSS configuration
├── eslint.config.js       # ESLint configuration
├── vercel.json            # Vercel deployment config
├── .gitignore             # Git ignore patterns
└── .env.example           # Environment variables template
```

---

## Development Workflow

### Daily Development
```bash
# 1. Start development environment
npm run dev              # Frontend (port 3000)
cd music2emotion_api && python api.py  # Backend (port 8000)

# 2. Make changes and test
npm run lint            # Check code quality
npm run build           # Verify build works
npm run type-check      # TypeScript verification

# 3. Commit changes
git add .
git commit -m "feat: add new feature"
git push origin feature-branch
```

### Code Quality Checks
```bash
# Linting
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix linting issues

# Type checking
npm run type-check      # TypeScript compilation check
tsc --noEmit           # Alternative type check

# Formatting
npx prettier --write . # Format all files
npx prettier --check . # Check formatting
```

### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature description"

# 3. Push and create PR
git push origin feature/new-feature
# Create Pull Request on GitHub

# 4. After PR approval
git checkout main
git pull origin main
git branch -d feature/new-feature
```

### Commit Message Convention
```bash
# Format: type(scope): description

# Types:
feat: new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: adding tests
chore: maintenance

# Examples:
feat(timeline): add swipe gesture support
fix(auth): resolve token refresh issue
docs(api): update endpoint documentation
style(ui): improve button hover effects
```

---

## Building and Testing

### Build Commands
```bash
# Development build
npm run dev              # Start dev server with hot reload

# Production build
npm run build            # Build for production
npm run preview          # Preview production build locally

# Type checking
npm run type-check       # Check TypeScript types
tsc --noEmit --watch     # Watch mode type checking
```

### Testing Strategy

#### Frontend Testing
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jsdom

# Run tests
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

**Test Example**
```typescript
// __tests__/components/ChapterCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ChapterCard } from '../src/components/ChapterCard';

describe('ChapterCard', () => {
  const mockProps = {
    chapter: 'Test Chapter',
    phase: '(2024)',
    content: 'Test content',
    soundtrack: 'Test Song by Test Artist',
    cardId: 1,
    totalCards: 3,
    onAudioPlay: jest.fn(),
  };

  it('renders chapter information correctly', () => {
    render(<ChapterCard {...mockProps} />);
    
    expect(screen.getByText('Test Chapter')).toBeInTheDocument();
    expect(screen.getByText('(2024)')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Test Song by Test Artist')).toBeInTheDocument();
  });

  it('calls onAudioPlay when play button is clicked', () => {
    render(<ChapterCard {...mockProps} />);
    
    const playButton = screen.getByRole('button');
    fireEvent.click(playButton);
    
    // Note: This would need to be updated based on actual implementation
    expect(mockProps.onAudioPlay).toHaveBeenCalled();
  });
});
```

#### Backend Testing
```bash
# Install testing dependencies
cd music2emotion_api
pip install pytest pytest-asyncio httpx

# Run tests
pytest                   # Run all tests
pytest -v               # Verbose output
pytest --cov=.          # Coverage report
```

**Test Example**
```python
# tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from api import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_device_info():
    response = client.get("/device-info")
    assert response.status_code == 200
    data = response.json()
    assert "device_type" in data
    assert "gpu_available" in data

@pytest.mark.asyncio
async def test_analyze_song():
    response = client.post("/analyze-song", json={
        "song_name": "Test Song",
        "artist_name": "Test Artist"
    })
    assert response.status_code == 200
    data = response.json()
    assert "emotions" in data
    assert "confidence_scores" in data
```

### Performance Testing
```bash
# Bundle size analysis
npm run build
npx vite-bundle-analyzer dist

# Load testing
npm install -g artillery
artillery quick --count 10 --num 20 http://localhost:3000

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

---

## Deployment Guide

### Frontend Deployment (Vercel)

#### Automatic Deployment
```bash
# 1. Connect GitHub repository to Vercel
# 2. Configure environment variables in Vercel dashboard
# 3. Push to main branch - auto-deployment triggers

# Manual deployment
npm install -g vercel
vercel --prod
```

#### Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Backend Deployment (AWS EC2)

#### Server Setup
```bash
# 1. Launch Ubuntu 20.04 LTS EC2 instance
# 2. Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Update system
sudo apt update && sudo apt upgrade -y

# 4. Install Python and dependencies
sudo apt install python3 python3-pip python3-venv nginx -y

# 5. Clone repository
git clone https://github.com/bjh-developer/vibelines.git
cd vibelines/music2emotion_api

# 6. Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r api_requirements.txt

# 7. Install system dependencies for audio processing
sudo apt install ffmpeg libsndfile1 -y
```

#### Production Configuration
```bash
# Create systemd service
sudo nano /etc/systemd/system/vibelines-api.service
```

```ini
[Unit]
Description=Vibelines Music2Emotion API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/vibelines/music2emotion_api
Environment=PATH=/home/ubuntu/vibelines/music2emotion_api/venv/bin
ExecStart=/home/ubuntu/vibelines/music2emotion_api/venv/bin/python api.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable vibelines-api
sudo systemctl start vibelines-api
sudo systemctl status vibelines-api
```

#### Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/vibelines-api
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type, Authorization, api-key';
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/vibelines-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Domain and SSL Setup
```bash
# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

---

## Environment Configuration

### Frontend Environment Variables
```bash
# .env.local (development)
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# .env.production (production)
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=https://vibelines.vercel.app/callback
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

### Backend Environment Variables
```bash
# .env (backend)
M2E_API_KEY=your_music2emotion_api_key
DEEZER_APP_ID=your_deezer_app_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Spotify App Configuration
```bash
# 1. Go to https://developer.spotify.com/dashboard
# 2. Create new app
# 3. Configure settings:
#    App Name: Vibelines
#    App Description: Musical emotion timeline generator
#    Redirect URIs: 
#      - http://localhost:3000/callback (development)
#      - https://vibelines.vercel.app/callback (production)
#    Bundle IDs: (leave empty)
#    Android Packages: (leave empty)
# 4. Save client ID and secret
```

### Supabase Project Setup
```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Run SQL commands from Database Setup section
# 4. Get URL and anon key from Settings > API
# 5. Configure Row Level Security policies
```

---

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# TypeScript compilation errors
Error: Cannot find module 'react-router-dom'
# Solution: Install missing dependencies
npm install react-router-dom @types/react-router-dom

# Vite build errors
Error: Failed to resolve import
# Solution: Check import paths and file extensions
# Ensure all imports use correct relative paths
```

#### Runtime Errors
```bash
# Spotify authentication issues
Error: Invalid redirect URI
# Solution: Check VITE_SPOTIFY_REDIRECT_URI matches Spotify app settings

# API connection errors
Error: Failed to fetch from Music2Emotion API
# Solution: Verify backend is running and accessible
curl http://104.198.230.255/
```

#### Development Server Issues
```bash
# Port already in use
Error: Port 3000 is already in use
# Solution: Kill process or use different port
npx kill-port 3000
# or
npm run dev -- --port 3001

# Hot reload not working
# Solution: Check if watching is enabled
npm run dev -- --watch
```

### Debugging Techniques

#### Frontend Debugging
```typescript
// Debug API calls
const debugApiCall = async (endpoint: string, options: RequestInit) => {
  console.log(`🔍 API Call: ${endpoint}`, options);
  try {
    const response = await fetch(endpoint, options);
    console.log(`✅ Response: ${response.status}`, await response.clone().json());
    return response;
  } catch (error) {
    console.error(`❌ API Error:`, error);
    throw error;
  }
};

// Debug component renders
const useRenderLogger = (componentName: string, props: any) => {
  useEffect(() => {
    console.log(`🔄 ${componentName} rendered with props:`, props);
  });
};
```

#### Backend Debugging
```python
# Add debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Debug middleware
@app.middleware("http")
async def debug_middleware(request: Request, call_next):
    start_time = time.time()
    logger.debug(f"📥 Incoming request: {request.method} {request.url}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.debug(f"📤 Response: {response.status_code} ({process_time:.4f}s)")
    
    return response
```

### Performance Issues

#### Frontend Performance
```bash
# Bundle size optimization
npm run build
npm run analyze  # If configured

# Memory leaks
# Use React DevTools Profiler
# Check for unsubscribed event listeners
# Verify useEffect cleanup functions
```

#### Backend Performance
```python
# Profile API endpoints
import cProfile
import pstats

def profile_endpoint(func):
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        result = func(*args, **kwargs)
        profiler.disable()
        
        stats = pstats.Stats(profiler)
        stats.sort_stats('cumtime')
        stats.print_stats(10)
        
        return result
    return wrapper

@profile_endpoint
async def analyze_song_endpoint():
    # Your endpoint code
    pass
```

---

## Contributing Guidelines

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards

#### TypeScript/React Standards
```typescript
// Use TypeScript strict mode
interface Props {
  title: string;
  optional?: boolean;
}

// Prefer function components with hooks
export default function Component({ title, optional = false }: Props) {
  // Component logic
}

// Use proper error boundaries
class ErrorBoundary extends React.Component {
  // Error boundary implementation
}
```

#### Python Standards
```python
# Follow PEP 8
# Use type hints
def analyze_emotion(song_name: str, artist_name: str) -> Dict[str, Any]:
    """Analyze emotion of a song.
    
    Args:
        song_name: Name of the song
        artist_name: Name of the artist
        
    Returns:
        Dictionary containing emotion analysis results
    """
    pass

# Use proper exception handling
try:
    result = risky_operation()
except SpecificException as e:
    logger.error(f"Operation failed: {e}")
    raise
```

### Pull Request Process
1. **Title**: Use conventional commit format
2. **Description**: Explain what and why
3. **Testing**: Include test results
4. **Screenshots**: For UI changes
5. **Documentation**: Update if needed

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass and coverage is maintained
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

---

## Performance Optimization

### Frontend Optimization

#### Bundle Optimization
```typescript
// Code splitting
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Tree shaking
import { specificFunction } from 'library';

// Dynamic imports
const loadModule = async () => {
  const module = await import('./heavyModule');
  return module.default;
};
```

#### Image Optimization
```bash
# Use WebP format with fallbacks
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" />
</picture>

# Optimize images
npm install -g @squoosh/cli
squoosh-cli --webp {} --oxipng {} *.jpg
```

#### Caching Strategies
```typescript
// Service Worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Local storage caching
const cacheManager = {
  set: (key: string, data: any, ttl: number = 3600000) => {
    const item = {
      data,
      expiry: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  
  get: (key: string) => {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const item = JSON.parse(stored);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data;
  }
};
```

### Backend Optimization

#### Model Optimization
```python
# Model caching
from functools import lru_cache

@lru_cache(maxsize=1)
def get_model():
    """Load model once and cache it."""
    return Music2emo()

# Batch processing
async def process_songs_batch(songs: List[Song], batch_size: int = 10):
    """Process songs in batches for better performance."""
    results = []
    for i in range(0, len(songs), batch_size):
        batch = songs[i:i + batch_size]
        batch_results = await analyze_batch(batch)
        results.extend(batch_results)
    return results
```

#### Database Optimization
```sql
-- Create appropriate indexes
CREATE INDEX CONCURRENTLY idx_mood_analysis_compound 
ON mood_analysis(user_id, created_at DESC);

-- Use connection pooling
-- Configure in Supabase dashboard or connection string
```

### Monitoring and Analytics
```typescript
// Performance monitoring
const perfObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === 'navigation') {
      console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart);
    }
  });
});

perfObserver.observe({ entryTypes: ['navigation', 'measure'] });

// Error tracking
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to monitoring service
});
```

---

This comprehensive development guide provides everything needed to work effectively with the Vibelines codebase, from initial setup to advanced optimization techniques.