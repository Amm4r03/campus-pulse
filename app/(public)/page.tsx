import Link from 'next/link'
import { 
  Send, 
  BarChart3, 
  Zap, 
  Clock, 
  ArrowRight,
  Building2,
  Users,
  Shield,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Send,
    title: 'Easy Submission',
    description: 'Submit issues through a simple, structured form. Choose your location, category, and describe the problem.',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'Monitor the status of your reported issues in real-time. Get notified when there are updates.',
  },
  {
    icon: Zap,
    title: 'Smart Triage',
    description: 'Our system automatically categorizes and prioritizes issues based on urgency and impact.',
  },
  {
    icon: Clock,
    title: 'Faster Resolution',
    description: 'Issues are routed directly to the right authority, reducing response time significantly.',
  },
]

const stats = [
  { value: '5000+', label: 'Students Served' },
  { value: '24h', label: 'Avg Response Time' },
  { value: '95%', label: 'Resolution Rate' },
  { value: '12+', label: 'Campus Locations' },
]

const steps = [
  {
    number: '01',
    title: 'Submit Your Issue',
    description: 'Fill out a simple form describing the problem, selecting the location and category.',
  },
  {
    number: '02',
    title: 'Automatic Processing',
    description: 'Our system analyzes, categorizes, and routes your issue to the appropriate authority.',
  },
  {
    number: '03',
    title: 'Track & Resolve',
    description: 'Monitor progress and receive updates until your issue is fully resolved.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <span className="mr-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                New
              </span>
              Jamia Hamdard&apos;s Official Issue Portal
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Report Campus Issues.{' '}
              <span className="text-primary">Get Them Resolved.</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Campus Pulse is the centralized platform for reporting and tracking campus issues at Jamia Hamdard. From hostel problems to infrastructure concerns, we ensure your voice is heard.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login">
                  Submit an Issue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative gradient */}
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              A complete solution for campus issue management, designed with students in mind.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-y bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to report and resolve campus issues.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="text-6xl font-bold text-primary/10">
                  {step.number}
                </div>
                <h3 className="mb-2 mt-4 text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-0.5 w-full bg-gradient-to-r from-primary/20 to-transparent md:block md:w-1/2 md:translate-x-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                  Built for <span className="text-primary">Transparency</span>
                </h2>
                <p className="mb-6 text-lg text-muted-foreground">
                  Campus Pulse ensures accountability at every step. Track your issues from submission to resolution with complete visibility.
                </p>
                <ul className="space-y-4">
                  {[
                    { icon: Shield, text: 'Anonymous reporting - your identity is protected' },
                    { icon: Users, text: 'Similar issues are grouped for faster resolution' },
                    { icon: TrendingUp, text: 'Priority based on impact and frequency' },
                    { icon: Building2, text: 'Direct routing to responsible authorities' },
                  ].map((item) => (
                    <li key={item.text} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <item.icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8">
                  <div className="flex h-full flex-col justify-center space-y-4">
                    <div className="rounded-lg bg-background p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                        <span className="text-sm font-medium">Water Issue - Boys Hostel 1</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">15 reports • High Priority</div>
                    </div>
                    <div className="rounded-lg bg-background p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium">WiFi Connectivity - Block A</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">8 reports • In Progress</div>
                    </div>
                    <div className="rounded-lg bg-background p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium">AC Repair - Library</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">3 reports • Resolved</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary py-16 text-primary-foreground md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Report an Issue?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
            Join thousands of students using Campus Pulse to make Jamia Hamdard a better place.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/login">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
