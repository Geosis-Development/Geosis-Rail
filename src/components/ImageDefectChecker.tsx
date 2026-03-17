import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Upload, Loader, Camera } from "lucide-react";

interface AIPrediction {
  label: "CRACKED" | "NORMAL";
  confidence: number;
  wear_percent: number;
  alert: boolean;
  source: string;
}

export default function ImageDefectChecker() {
  const [result, setResult]       = useState<AIPrediction | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Send to API
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("http://localhost:5000/predict/image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("API error");
      const data: AIPrediction = await res.json();
      setResult(data);
    } catch (err) {
      setError("Could not connect to AI — make sure api.py is running");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Camera className="h-4 w-4" />
          AI Visual Defect Checker — InceptionV3
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            loading ? "border-border/40 opacity-50" : "border-border/60 hover:border-primary/50"
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Drop a rail track photo here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse — JPG, PNG supported</p>
        </div>

        {/* Preview + Result side by side */}
        {(preview || loading || result) && (
          <div className="flex gap-4 flex-wrap">

            {/* Image preview */}
            {preview && (
              <div className="flex-shrink-0">
                <img
                  src={preview}
                  alt="Rail track"
                  className="w-40 h-40 object-cover rounded-lg border border-border/60"
                />
              </div>
            )}

            {/* Result */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader className="h-4 w-4 animate-spin" />
                  Analysing image with InceptionV3...
                </div>
              )}

              {error && (
                <p className="text-sm text-orange-400">{error}</p>
              )}

              {result && (
                <div className={`p-3 rounded-lg border-2 ${
                  result.alert
                    ? "border-red-500 bg-red-500/10"
                    : result.label === "CRACKED"
                    ? "border-orange-400 bg-orange-400/10"
                    : "border-green-500 bg-green-500/10"
                }`}>
                  {/* Label */}
                  <div className="flex items-center gap-2 mb-2">
                    {result.label === "CRACKED"
                      ? <AlertTriangle className="h-5 w-5 text-red-400" />
                      : <CheckCircle className="h-5 w-5 text-green-400" />
                    }
                    <span className={`text-lg font-bold font-mono ${
                      result.label === "CRACKED" ? "text-red-400" : "text-green-400"
                    }`}>
                      {result.label}
                    </span>
                    {result.alert && (
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                        CRITICAL
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      Confidence
                      <p className="text-sm font-mono font-bold text-foreground">{result.confidence}%</p>
                    </div>
                    <div>
                      Wear Level
                      <p className={`text-sm font-mono font-bold ${
                        result.wear_percent >= 80 ? "text-red-400" :
                        result.wear_percent >= 60 ? "text-orange-400" :
                        "text-foreground"
                      }`}>{result.wear_percent}%</p>
                    </div>
                  </div>

                  {/* Wear bar */}
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        result.wear_percent >= 80 ? "bg-red-500" :
                        result.wear_percent >= 60 ? "bg-orange-400" :
                        "bg-green-500"
                      }`}
                      style={{ width: `${result.wear_percent}%` }}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Model: {result.source} — trained on real railway track images
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tip */}
        {!preview && (
          <p className="text-xs text-muted-foreground">
            Upload any rail track image to check for defects using the InceptionV3 visual AI model
          </p>
        )}
      </CardContent>
    </Card>
  );
}
