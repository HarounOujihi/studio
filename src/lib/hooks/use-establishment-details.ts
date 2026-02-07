import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { currentEtbIdAtom } from "@/lib/store/auth-oidc";
import { establishmentDetailsAtom } from "@/lib/store/auth";

export function useEstablishmentDetails() {
  const etbId = useAtomValue(currentEtbIdAtom);
  const setDetails = useSetAtom(establishmentDetailsAtom);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      if (!etbId) {
        setDetails(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/establishment?etbId=${etbId}`);
        if (response.ok) {
          const data = await response.json();
          setDetails(data.establishment);
        }
      } catch (error) {
        console.error("Failed to fetch establishment details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetails();
  }, [etbId, setDetails]);

  return { isLoading };
}
