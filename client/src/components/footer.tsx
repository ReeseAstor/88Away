import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <>
      <Separator />
      <footer data-testid="footer-main" className="mt-auto py-6 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p data-testid="text-copyright" className="text-sm text-muted-foreground">
              © 2025 88Away. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link data-testid="link-privacy" href="/privacy" className="text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link data-testid="link-terms" href="/terms" className="text-muted-foreground hover:text-foreground">
                Terms & Conditions
              </Link>
              <Link data-testid="link-cookies" href="/cookies" className="text-muted-foreground hover:text-foreground">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
