# OriginLab AI 🧪

**Transform Scientific Hypotheses into Complete Experiment Blueprints in Minutes**

OriginLab AI is an intelligent platform that converts a single-line scientific hypothesis into a comprehensive, executable experiment blueprint — including detailed protocols, materials list, budget estimations, and safety assessments.

## 🌐 Live Demo

**[Try OriginLab AI Now](https://origin-lab-ai.lovable.app/)**

Experience the platform live and see how it transforms your scientific ideas into actionable experiment blueprints in minutes!

## 🚀 Features

### Core Capabilities

- **AI-Powered Hypothesis Generation**: Input a simple scientific hypothesis and receive a complete experiment blueprint
- **Automatic Protocol Generation**: Generate detailed, step-by-step experimental protocols tailored to your hypothesis
- **Materials & Budget Planning**: Get an itemized materials list with cost estimations
- **Timeline Planning**: Automatic scheduling and duration estimates for each experimental phase
- **Validation Framework**: Built-in validation criteria to ensure experimental rigor
- **Safety Assessment**: Comprehensive safety analysis and precautions for your experiment
- **Export to PDF**: Download your complete experiment blueprint as a professional PDF document

### User Experience Features

- **Intuitive Dashboard**: Manage all your experiments in one place
- **Experiment Library**: Store, organize, and reference your past experiments
- **Real-time Processing**: Watch your experiment blueprint generate in real-time
- **Collaborative Environment**: Share and discuss experiments with your team
- **Dark Mode Support**: Comfortable interface for extended work sessions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Technical Features

- **Secure Authentication**: User account management with Lovable Cloud Auth
- **Real-time Database**: Supabase integration for instant data synchronization
- **Query Optimization**: React Query for efficient data fetching and caching
- **Modern UI Components**: shadcn/ui components for consistent, accessible interface
- **Responsive Layout**: Tailwind CSS for beautiful, responsive design
- **State Management**: Robust context API for application state

## 📋 Pages & Sections

### Landing Page
- Hero section introducing OriginLab AI
- Feature showcase with use cases
- Call-to-action to start creating experiments
- Authentication gateway

### Authentication
- Secure login/signup with email verification
- OAuth integration via Lovable Cloud Auth
- Session management
- Account recovery options

### Dashboard
- Overview of all experiments
- Quick statistics and insights
- Experiment list with filtering and sorting
- Quick access to recent experiments
- Create new experiment button

### New Experiment
- Interactive hypothesis input form
- AI-powered form enhancement
- Real-time suggestions and improvements
- Configuration options for experiment parameters
- Submit for blueprint generation

### Experiment Detail View
- Complete experiment blueprint display
- Protocol steps with detailed instructions
- Materials checklist with quantities and costs
- Timeline visualization
- Budget breakdown
- Safety considerations
- Export to PDF functionality
- Edit and iterate on experiments
- Share options with team members

## 🏗️ Project Structure

```
OriginLab_AI/
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── plan/               # Experiment planning components
│   │   ├── discussion/         # Collaboration components
│   │   ├── AppHeader.tsx       # Navigation header
│   │   ├── HypothesisEnhancer.tsx  # AI hypothesis enhancement
│   │   ├── ProtectedLayout.tsx # Auth-protected routes
│   │   └── NavLink.tsx         # Navigation link component
│   ├── pages/
│   │   ├── Landing.tsx         # Landing page
│   │   ├── Auth.tsx            # Authentication page
│   │   ├── Dashboard.tsx       # User dashboard
│   │   ├── NewExperiment.tsx   # Create new experiment
│   │   ├── ExperimentDetail.tsx # View experiment details
│   │   └── NotFound.tsx        # 404 page
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state management
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── integrations/           # API integrations
│   ├── types/                  # TypeScript type definitions
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles
├── supabase/                   # Supabase configurations
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── README.md                   # This file
```

## 🛠️ Tech Stack

### Frontend Framework
- **React 18.3+**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Next-generation build tool
- **React Router**: Client-side routing

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Lucide Icons**: Beautiful, consistent icons
- **Radix UI**: Accessible component primitives

### State & Data Management
- **React Query**: Server state management and caching
- **React Hook Form**: Efficient form handling
- **Zod**: TypeScript-first schema validation
- **Context API**: Client-side state management

### Backend & Database
- **Supabase**: PostgreSQL database and authentication
- **Lovable Cloud Auth**: Secure user authentication

### Additional Libraries
- **React Markdown**: Markdown rendering
- **jsPDF & jsPDF AutoTable**: PDF generation
- **Recharts**: Data visualization
- **Date-fns**: Date utilities
- **Sonner**: Toast notifications
- **React Resizable Panels**: Flexible layouts

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ or Bun
- npm, yarn, or bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tanishq9876/OriginLab_AI.git
   cd OriginLab_AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Configure your Supabase and Lovable Cloud Auth credentials in `.env.local`

4. **Start development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to see the application

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode

## 🔐 Authentication

OriginLab AI uses **Lovable Cloud Auth** for secure user authentication. Features include:
- Email/password authentication
- OAuth integration
- Secure session management
- Protected routes for authenticated users

## 💾 Database

The application uses **Supabase** for:
- User data storage
- Experiment blueprint storage
- Real-time data synchronization
- File storage for exports

## 📊 Features in Detail

### Hypothesis Enhancement
The **HypothesisEnhancer** component provides AI-powered suggestions to improve your scientific hypothesis before generating the complete blueprint.

### Experiment Blueprint
Complete generated blueprints include:
- **Protocol**: Step-by-step experimental procedures
- **Materials**: Itemized list with specifications
- **Budget**: Cost breakdown and total estimation
- **Timeline**: Duration and scheduling information
- **Validation**: Success criteria and validation methods
- **Safety**: Risk assessment and safety precautions

### PDF Export
Export your complete experiment blueprint as a professional PDF document for:
- Sharing with colleagues
- Submitting to lab notebooks
- Including in research proposals
- Offline reference

## 🎨 UI/UX Highlights

- **Dark Mode**: Optimized dark theme for comfortable viewing
- **Responsive Design**: Adapts to all screen sizes
- **Accessible Components**: Built with accessibility in mind
- **Smooth Animations**: Tailwind CSS animations for polish
- **Intuitive Navigation**: Clear user flows and navigation structure

## 🔗 Links

- **Live Application**: [OriginLab AI](https://origin-lab-ai.lovable.app/)
- **Repository**: [GitHub](https://github.com/Tanishq9876/OriginLab_AI)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 🙋 Support

For support, please open an issue on the GitHub repository or contact the development team.

---

**OriginLab AI** - Accelerating scientific discovery through intelligent experiment planning 🔬✨
