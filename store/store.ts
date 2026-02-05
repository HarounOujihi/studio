import { ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
// import type { ProfileFragment } from "gql/graphql";
import { atom } from "jotai";
// import { atomWithStorage } from "jotai/utils";
import { atomWithBroadcast, atomWithStoredBroadcast } from "./broadcast";

// Simple User type (replace with actual type from your auth system)
export interface User {
  id: string;
  email?: string;
  name?: string;
  image?: string;
}

export const authAtom = atom<User | null>(null);
export const currUserAtom = atomWithBroadcast<string | null>("currUser", null);

// export const profileAtom = atom<ProfileFragment | null>(null);

export const filesAtom = atom<ListObjectsV2CommandOutput["Contents"]>([]);

export type Scope = `${string}:${string}`;

export const currencyAtom = atom<string | undefined>("TND");

export interface ZoomImageState {
  src: string;
  alt: string;
  isOpen: boolean;
}

export const zoomImageAtom = atom<ZoomImageState>({
  src: "",
  alt: "",
  isOpen: false,
});

export const scopeAtom = atomWithStoredBroadcast<Scope | undefined>(
  "scope",
  undefined,
  undefined,
  (v) => {
    if (typeof document !== "undefined") {
      document.cookie = `scope=${v}; secure; SameSite=Strict; expires=Thu, 01 Jan 10000 00:00:00 UTC; path=/`;
      // window.wsGqlClient?.terminate(); // force graphql-ws to reconnect websocket
      window.dispatchEvent(new Event("visibilitychange")); // trigger graphql refetch queries using the urql's refocusExcahnge
    }
    return v;
  },
);
