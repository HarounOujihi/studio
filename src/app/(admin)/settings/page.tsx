import { EstablishmentSettings } from "@/components/settings/establishment-settings";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto pb-16">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Paramètres</h1>
      </div>

      <EstablishmentSettings />
    </div>
  );
}
