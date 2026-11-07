"use client";

import { useEffect, useRef, useState } from "react";
import { PictureOutlined } from "@ant-design/icons";

interface Props {
  /** The photo already saved for this variant (edit screens). */
  currentUrl?: string | null;
  /** A newly chosen photo, not uploaded yet. */
  file?: File | null;
  onPick: (file: File) => void;
  required?: boolean;
  size?: number;
}

/** Square photo box for one variant: shows the photo and lets the user choose / replace it. */
export default function VariantImagePicker({ currentUrl, file, onPick, required, size = 96 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview || currentUrl || null;

  return (
    <div className="variant-image-picker">
      <button
        type="button"
        className="variant-image-box"
        style={{ width: size, height: size }}
        onClick={() => inputRef.current?.click()}
        aria-label={shown ? "Change variant photo" : "Add variant photo"}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Variant" />
        ) : (
          <span className="variant-image-empty">
            <PictureOutlined />
            <small>Add photo{required ? " *" : ""}</small>
          </span>
        )}
      </button>
      {shown && (
        <button type="button" className="variant-image-change" onClick={() => inputRef.current?.click()}>
          Change
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && f.type.startsWith("image/")) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
