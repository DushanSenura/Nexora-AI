import { Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const plans = [
  { name: "Starter", price: "$19", features: ["AI chat", "Document uploads", "Basic agents"] },
  { name: "Team", price: "$59", features: ["Shared workspace", "Admin analytics", "Priority models"] },
  { name: "Enterprise", price: "Custom", features: ["SSO-ready auth", "Private models", "Dedicated support"] },
];

export function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Pricing</h1>
      <p className="mt-2 text-muted-foreground">Plans for individuals, teams, and organizations building AI workflows.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-2xl font-semibold">{plan.price}</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full">Choose plan</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

