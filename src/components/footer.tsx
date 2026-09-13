import Link from "next/link";
import { SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="text-white font-semibold mb-4">Browse</h4>
            <ul className="space-y-2 text-neutral-400">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/#trending" className="hover:text-white transition-colors">Trending</Link></li>
              <li><Link href="/#originals" className="hover:text-white transition-colors">Originals</Link></li>
              <li><Link href="/#drama" className="hover:text-white transition-colors">Drama</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>Account & Billing</li>
              <li>Supported Devices</li>
              <li>Accessibility</li>
              <li>Contact Us</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>About Goothiah TV</li>
              <li>Careers</li>
              <li>Press</li>
              <li>Investors</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>Privacy Policy</li>
              <li>Terms of Use</li>
              <li>Cookie Preferences</li>
              <li>Content Guidelines</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>This is a demonstration streaming UI built with Next.js.</p>
        </div>
      </div>
    </footer>
  );
}
