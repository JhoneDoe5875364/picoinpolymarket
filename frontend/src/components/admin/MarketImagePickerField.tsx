"use client";

import { useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type MarketImage = { name: string; url: string };

type MarketImagePickerFieldProps = {
  label?: string;
  selectedIcon?: string;
  images: MarketImage[];
  isUploadingImage: boolean;
  onUploadImage: (file: File) => void | Promise<void>;
  onSelectImage: (url: string) => void;
};

export function MarketImagePickerField({
  label = "Market Image",
  selectedIcon,
  images,
  isUploadingImage,
  onUploadImage,
  onSelectImage,
}: MarketImagePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const imageOptions = useMemo(() => {
    return images.map((img) => ({
      ...img,
      value: img.url,
    }));
  }, [images]);

  return (
    <>
      <div className="flex items-start gap-3 md:block md:space-y-0">
        <Label className="m-0 w-24 shrink-0 md:w-auto text-xs text-muted-foreground">{label}</Label>
        <div className="flex flex-1 items-center gap-3">
          <div className="h-24 w-24 overflow-hidden rounded-md border bg-muted/20">
            {selectedIcon ? (
              <img src={selectedIcon} alt="Selected market image" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                No image selected
              </div>
            )}
          </div>
          <Button type="button" variant="outline" onClick={() => setIsOpen(true)}>
            Select Image
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Market Image</DialogTitle>
            <DialogDescription>Upload a new image or choose one from existing uploads.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className={cn("inline-flex", isUploadingImage && "opacity-60")}>
              <Button type="button" variant="outline" className="gap-2" asChild disabled={isUploadingImage}>
                <span>
                  <UploadCloud className="h-4 w-4" />
                  {isUploadingImage ? "Uploading..." : "Upload image"}
                </span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp,.gif,image/*"
                disabled={isUploadingImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void onUploadImage(file);
                  }
                  e.currentTarget.value = "";
                }}
              />
            </label>

            {imageOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No uploaded image yet.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto pr-1">
                <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                  {imageOptions.map((img) => {
                    const active = selectedIcon === img.value;
                    return (
                      <button
                        type="button"
                        key={img.name}
                        onClick={() => {
                          onSelectImage(img.value);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "overflow-hidden rounded-md border bg-muted/20 transition",
                          active ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/40"
                        )}
                      >
                        <img src={img.url} alt={img.name} className="h-16 w-full object-cover" loading="lazy" />
                        <div className="truncate px-2 py-1 text-[11px]">{img.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
