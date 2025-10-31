import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const router = useRouter()

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 liquid-morph opacity-30" />
      
      {/* Navigation Header */}
      <nav className="relative z-20 w-full">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 via-orange-400 to-yellow-400 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                B
              </div>
              <span className="text-xl font-bold gradient-text">B-mo</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="text-gray-700 hover:text-teal-600 hover:bg-teal-50"
                onClick={() => router.navigate({ to: '/login' })}
              >
                Sign In
              </Button>
              <Button
                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg"
                onClick={() => router.navigate({ to: '/register' })}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          {/* B-mo Logo/Character */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 via-orange-400 to-yellow-400 flex items-center justify-center text-4xl font-bold text-white shadow-lg glow">
              B
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-4 gradient-text text-shadow-lg">
            Welcome to B-mo
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 font-medium">
            Enterprise-grade AI Accounting Platform
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Transform your financial management with intelligent automation, 
            AI-powered insights, and seamless collaboration.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-teal-600 text-teal-600 bg-white/50 backdrop-blur-sm px-8 py-6 text-lg hover:bg-teal-50 hover:border-teal-700 transition-all"
              onClick={() => router.navigate({ to: '/login' })}
            >
              Sign In
            </Button>
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-8 py-6 text-lg shadow-lg glow-hover transition-all"
              onClick={() => router.navigate({ to: '/register' })}
            >
              Sign Up Free
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-20">
          <Card className="glass-card hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <CardTitle className="text-xl">AI-Powered Document Intelligence</CardTitle>
              <CardDescription className="text-base">
                Automatically extract and process invoices and receipts with advanced OCR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  Azure Document Intelligence
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Vector embeddings for search
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Automated approval workflows
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <CardTitle className="text-xl">Financial Forecasting</CardTitle>
              <CardDescription className="text-base">
                LSTM-powered predictions for sales, revenue, and KPIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  Time-series forecasting
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  AI-generated insights
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Budget automation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <CardTitle className="text-xl">Natural Language Search</CardTitle>
              <CardDescription className="text-base">
                GPT-5 powered RAG chat for querying your financial data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  RAG-based search
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Ledger explanations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Document retrieval
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-transform duration-300 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-orange-500 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <CardTitle className="text-xl">Advanced Workflows</CardTitle>
              <CardDescription className="text-base">
                Multi-step approval processes and collaboration tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  RBAC permissions
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Audit trails
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Anomaly detection
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <CardTitle className="text-xl">Financial Reports</CardTitle>
              <CardDescription className="text-base">
                Generate SOFP, SOPL, and custom reports with AI insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  Automated report generation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Export PDF/Excel/CSV
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  AI-powered summaries
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-yellow-500 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <CardTitle className="text-xl">Enterprise Security</CardTitle>
              <CardDescription className="text-base">
                Multi-tenant isolation with robust access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  Tenant isolation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  Role-based access
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Data encryption
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <div className="glass-card p-12 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Ready to Transform Your Accounting?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join enterprises leveraging AI to streamline their financial operations
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-600 via-orange-500 to-yellow-500 hover:from-teal-700 hover:via-orange-600 hover:to-yellow-600 text-white px-12 py-6 text-lg shadow-xl glow-hover"
              onClick={() => router.navigate({ to: '/register' })}
            >
              Sign Up Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

