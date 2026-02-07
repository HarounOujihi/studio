import { EstablishmentSettings } from "@/components/settings/establishment-settings";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl lg:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your establishment information and preferences
        </p>
      </div>

      <EstablishmentSettings />
    </div>
  );
}
