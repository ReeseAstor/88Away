import { Card, CardContent } from "@/components/ui/card";
import { Seo } from "@/components/seo";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Seo
        title="Page Not Found"
        description="The page you’re looking for isn’t available on 88Away. Head back to the platform to continue your writing workflow."
        noindex
      />
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              Did you forget to add the page to the router?
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
