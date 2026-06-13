import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * useUploadFile — uploads a File to Convex storage and returns its storageId.
 * Flow: ask the backend for a short-lived upload URL, POST the file to it,
 * read back the storageId. Attach that id to a record via a mutation.
 */
export function useUploadFile() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  return async (file: File): Promise<Id<"_storage">> => {
    const url = await generateUploadUrl();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) throw new Error("Upload failed");
    const { storageId } = (await res.json()) as {
      storageId: Id<"_storage">;
    };
    return storageId;
  };
}
