# SnapSplit 📸💰

**Snap a receipt, split it fair, settle in seconds.**

SnapSplit is a modern web application that uses AI-powered OCR to automatically read receipts and intelligently split bills among friends. Built with Next.js 13, TypeScript, and Supabase.

## 🚀 Features

- **📸 Smart Receipt Scanning**: AI-powered OCR using Mindee API to extract items and amounts
- **🎤 Voice Participant Entry**: Add participants by speaking their names
- **🤖 Intelligent Splitting**: Equal splits with manual item assignment
- **💬 Easy Sharing**: Generate payment messages with one tap
- **📱 Mobile-First PWA**: Installable progressive web app optimized for mobile
- **🔐 Secure Authentication**: User accounts with Supabase Auth
- **📊 History Tracking**: Save and archive past splits
- **🌙 Dark Mode**: Full dark/light theme support

## 🏗️ Project Structure

```
snapsplit/
├── app/                          # Next.js 13 App Router
│   ├── api/                      # API Routes
│   │   ├── ocr/route.ts         # Mindee OCR integration
│   │   ├── smart-split/route.ts # OpenAI-powered splitting rules
│   │   └── stt/route.ts         # Speech-to-text (Whisper API)
│   ├── history/page.tsx         # Receipt history view
│   ├── login/page.tsx           # Authentication page
│   ├── settings/page.tsx        # User profile & payment info
│   ├── share/page.tsx           # Share split results
│   ├── snap/page.tsx            # Camera/upload interface
│   ├── split/page.tsx           # Split configuration
│   ├── globals.css              # Global styles & CSS variables
│   ├── layout.tsx               # Root layout with theme provider
│   └── page.tsx                 # Home dashboard
├── components/                   # Reusable UI components
│   ├── ui/                      # shadcn/ui components
│   ├── hero-strip.tsx           # Gradient header component
│   ├── navigation.tsx           # Bottom navigation bar
│   └── theme-provider.tsx       # Dark/light theme context
├── lib/                         # Utility libraries
│   ├── auth.ts                  # Supabase authentication helpers
│   ├── supabase.ts              # Database client & types
│   └── utils.ts                 # Utility functions
├── public/                      # Static assets
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service worker for offline support
│   └── *.png                    # Icons and images
├── hooks/                       # Custom React hooks
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
└── package.json                 # Dependencies and scripts
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 13** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Lucide React** - Beautiful icon library
- **next-themes** - Dark/light mode support

### Backend & Services
- **Supabase** - Backend-as-a-Service (Auth, Database, Storage)
- **Mindee API** - OCR for receipt processing
- **OpenAI API** - GPT-4 for intelligent splitting & Whisper for speech-to-text
- **Vercel/Netlify** - Deployment platform

### Database Schema
```sql
-- User profiles
user_profile (
  id: uuid (references auth.users)
  account_name: text
  payment_info: text
  created_at: timestamptz
)

-- Receipt storage
receipts (
  id: uuid
  owner: uuid (references auth.users)
  vendor: text
  total: numeric
  image_url: text
  json_items: jsonb
  json_participants: jsonb
  created_at: timestamptz
)
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Mindee API key
- OpenAI API key

### Environment Variables
Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
MINDEE_API_KEY=your_mindee_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/snapsplit.git
   cd snapsplit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations (see Database Setup below)
   - Add your Supabase credentials to `.env.local`

4. **Configure API keys**
   - Get a Mindee API key from [mindee.com](https://mindee.com)
   - Get an OpenAI API key from [openai.com](https://openai.com)
   - Add both keys to `.env.local`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🗄️ Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- User profiles table
CREATE TABLE user_profile (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  account_name text,
  payment_info text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on user_profile
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own profile
CREATE POLICY "Users can access own profile" ON user_profile
  FOR ALL USING (auth.uid() = id);

-- Receipts table
CREATE TABLE receipts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner uuid REFERENCES auth.users(id) NOT NULL,
  vendor text,
  total numeric,
  image_url text,
  json_items jsonb,
  json_participants jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own receipts
CREATE POLICY "Users can access own receipts" ON receipts
  FOR ALL USING (auth.uid() = owner);
```

## 📱 User Flow

1. **Sign Up/Login** - Create account or sign in
2. **Set Profile** - Add display name and payment info
3. **Snap Receipt** - Take photo or upload receipt image
4. **AI Processing** - OCR extracts items and amounts automatically
5. **Add Participants** - Use voice input or manual entry
6. **Configure Split** - Apply equal split or customize per item
7. **Share Results** - Send payment requests via native sharing
8. **Archive** - Save split to history for future reference

## 🎨 Design System

### Colors
- **Primary Teal**: `#00B3B8` - Main brand color
- **Accent Mustard**: `#FFC857` - Secondary accent
- **Neutral Grays**: Various shades for text and backgrounds

### Typography
- **Font**: Inter (system font fallback)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold)
- **Scale**: Tailwind's default type scale

### Components
- **Cards**: Subtle shadows with rounded corners
- **Buttons**: Smooth hover states and active scaling
- **Navigation**: Fixed bottom navigation for mobile-first UX

## 🔧 API Endpoints

### `/api/ocr` (POST)
Processes receipt images using Mindee OCR
- **Input**: FormData with image file
- **Output**: Extracted vendor, total, and line items

### `/api/stt` (POST)
Converts speech to text using OpenAI Whisper
- **Input**: FormData with audio blob
- **Output**: Transcribed text

### `/api/smart-split` (POST)
Applies intelligent splitting rules using GPT-4
- **Input**: Items, participants, and splitting rule
- **Output**: Assignment recommendations

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Build command: `npm run build`
2. Publish directory: `out`
3. Add environment variables in Netlify dashboard

## 🧪 Testing

```bash
# Run type checking
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@snapsplit.app or open an issue on GitHub.

## 🙏 Acknowledgments

- [Mindee](https://mindee.com) for OCR capabilities
- [OpenAI](https://openai.com) for AI-powered features
- [Supabase](https://supabase.com) for backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- [Lucide](https://lucide.dev) for icons

---

**Made with ❤️ for splitting bills fairly**