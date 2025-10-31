import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useCompany } from '@/hooks/useCompany'
import { createCompany } from '@/lib/neon/companies'
import { updateUserCompany, updateUserRole } from '@/lib/neon/users'
import { getRoleByName } from '@/lib/neon/roles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { toast } from 'sonner'

interface CompanyFormData {
  name: string
  legal_name: string
  email: string
  phone: string
  phone_country_code: string
  address: string
  website: string
  currency_code: string
}

export function CompanyOnboarding() {
  const { user } = useAuth()
  const { refresh } = useCompany()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    legal_name: '',
    email: user?.email || '',
    phone: '',
    phone_country_code: '',
    address: '',
    website: '',
    currency_code: 'USD',
  })

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) {
      setError('Company name is required')
      return
    }
    setError(null)
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    if (!formData.name.trim()) {
      setError('Company name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create company
      const company = await createCompany({
        name: formData.name,
        legal_name: formData.legal_name || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        phone_country_code: formData.phone_country_code || undefined,
        address: formData.address || undefined,
        website: formData.website || undefined,
        currency_code: formData.currency_code,
      })

      // Get admin role
      const adminRole = await getRoleByName('admin')
      if (!adminRole) {
        throw new Error('Admin role not found in database')
      }

      // Link user to company and assign admin role
      await updateUserCompany(user.$id, company.id)
      await updateUserRole(user.$id, adminRole.id)

      // Refresh company context
      await refresh()

      // Show success notification
      toast.success('Company created successfully!', {
        description: `${company.name} has been set up and you are now the admin.`,
        duration: 4000,
      })

      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.navigate({ to: '/dashboard' })
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to create company')
      setLoading(false)
      toast.error('Failed to create company', {
        description: err.message || 'Please try again.',
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to B-mo! 🎉
          </CardTitle>
          <CardDescription className="text-center">
            Let's set up your company to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s
                        ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step > s ? '✓' : s}
                  </div>
                  {s < 2 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        step > s ? 'bg-teal-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-16 mt-2">
              <span
                className={`text-sm ${
                  step >= 1 ? 'text-teal-600 font-medium' : 'text-gray-500'
                }`}
              >
                Basic Info
              </span>
              <span
                className={`text-sm ${
                  step >= 2 ? 'text-teal-600 font-medium' : 'text-gray-500'
                }`}
              >
                Additional Details
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label
                  htmlFor="legal_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Legal Name
                </label>
                <input
                  id="legal_name"
                  type="text"
                  value={formData.legal_name}
                  onChange={(e) => handleInputChange('legal_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Acme Incorporated"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Company Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="contact@company.com"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleNext} className="bg-teal-600 hover:bg-teal-700">
                  Next: Additional Details
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Additional Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone
                  </label>
                  <PhoneInput
                    defaultCountry="us"
                    value={formData.phone}
                    onChange={(value, country) => {
                      setFormData((prev) => ({
                        ...prev,
                        phone: value,
                        phone_country_code: country?.countryCode || '',
                      }))
                    }}
                    className="w-full"
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="currency_code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Currency
                  </label>
                  <select
                    id="currency_code"
                    value={formData.currency_code}
                    onChange={(e) => handleInputChange('currency_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="MYR">MYR (RM)</option>
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="https://www.company.com"
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-teal-600 via-orange-500 to-yellow-500 hover:from-teal-700 hover:via-orange-600 hover:to-yellow-600 text-white"
                >
                  {loading ? 'Creating Company...' : 'Create Company & Continue'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

