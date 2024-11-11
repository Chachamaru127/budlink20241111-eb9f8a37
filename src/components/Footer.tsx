"use client"

import Link from 'next/link'

interface LinkObject {
  id: number
  label: string
  url: string
}

interface FooterProps {
  links: LinkObject[]
}

export default function Footer({ links }: FooterProps) {
  return (
    <footer className="bg-gray-100 py-8 mt-auto" role="contentinfo">
      <div className="container mx-auto px-4">
        <nav>
          <ul className="flex justify-center space-x-6 mb-4" role="list">
            {links.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.url}
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-center text-gray-600 text-sm">
          © 2024 BudLink. All rights reserved.
        </div>
      </div>
    </footer>
  )
}