import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  product: [
    { href: '/#features', label: 'Features' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/login', label: 'Get Started' },
  ],
  support: [
    { href: '#', label: 'Help Center' },
    { href: '#', label: 'Contact Us' },
    { href: '#', label: 'FAQs' },
  ],
  legal: [
    { href: '#', label: 'Privacy Policy' },
    { href: '#', label: 'Terms of Service' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">C</span>
              </div>
              <span className="text-xl font-semibold tracking-tight">
                Campus<span className="text-primary">Pulse</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A centralized issue triage portal for Jamia Hamdard. Report campus issues, track progress, and get faster resolutions.
            </p>
            <p className="text-xs text-muted-foreground">
              A Jamia Hamdard Initiative
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Jamia Hamdard, Hamdard Nagar, New Delhi - 110062</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:support@campuspulse.in" className="hover:text-primary">
                  support@campuspulse.in
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+911126059688" className="hover:text-primary">
                  +91 11 2605 9688
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Campus Pulse. All rights reserved.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
