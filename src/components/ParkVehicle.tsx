import { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera,
  Upload,
  Check,
  AlertTriangle,
  Loader2,
  Type,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ScanLine,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { performOCR } from "../lib/ocr";
import {
  getOccupiedBays,
  getBayOccupant,
  refreshVehicleCache,
} from "../lib/storage";
import { apiFindVehicle, apiSaveVehicle } from "../lib/api";
import { VehicleRecord, AppView } from "../types";

const BAY_OPTIONS = ["A01", "A02", "A03", "A04", "B11", "B14", "B15", "C02"];
type Step = "capture" | "processing" | "confirm" | "done";
type OcrStatus = "idle" | "scanning" | "detected" | "not_found" | "unavailable";

interface ParkVehicleProps {
  addToast?: (message: string, type?: "success" | "error" | "info") => void;
  onNavigate?: (view: AppView) => void;
}

export default function ParkVehicle({
  addToast,
  onNavigate,
}: ParkVehicleProps) {
  const [step, setStep] = useState<Step>("capture");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [carNumber, setCarNumber] = useState("");
  const [bayNumber, setBayNumber] = useState("");
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>("idle");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [existingBay, setExistingBay] = useState("");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showBayOccupiedModal, setShowBayOccupiedModal] = useState(false);
  const [bayOccupantPlate, setBayOccupantPlate] = useState("");
  const [customBay, setCustomBay] = useState("");
  const [occupiedBays, setOccupiedBays] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "confirm") {
      setOccupiedBays(getOccupiedBays());
    }
  }, [step]);

  // ─── Image Handler ───

  // ─── Image Handler ───

  const handleImage = useCallback(async (file: File) => {
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Move to processing step
    setStep("processing");
    setOcrStatus("scanning");

    try {
      // NOW USING INSTANT LOCAL OCR!
      const result = await performOCR(file);

      if (result.plateNumber) {
        setCarNumber(result.plateNumber.toUpperCase());
        setOcrStatus("detected");

        try {
          const findResp = await apiFindVehicle(result.plateNumber);
          if (findResp.found && findResp.bay_number) {
            setIsDuplicate(true);
            setExistingBay(findResp.bay_number);
          }
        } catch (innerErr) {
          // Ignore offline errors during duplicate check
        }
      } else {
        setOcrStatus("not_found");
      }

      setStep("confirm");
    } catch (err: any) {
      console.error("OCR Error:", err);
      setOcrStatus("unavailable");
      setStep("confirm");
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImage(file);
    },
    [handleImage],
  );

  const handleManualEntry = () => {
    setOcrStatus("idle");
    setStep("confirm");
  };

  // ─── Bay Selection ───

  const handleBaySelect = (bay: string) => {
    if (bayNumber === bay) {
      setBayNumber("");
    } else {
      setBayNumber(bay);
      setCustomBay("");
    }
  };

  const handleCustomBay = (value: string) => {
    setCustomBay(value.toUpperCase());
    if (value.trim()) {
      setBayNumber(value.trim().toUpperCase());
    } else {
      setBayNumber("");
    }
  };

  // ─── Save Logic ───

  // ─── Save Logic ───

  const doSave = async () => {
    setSaving(true);
    try {
      const response = await apiSaveVehicle(carNumber.trim(), bayNumber.trim());
      if (response.success) {
        await refreshVehicleCache();
        setOccupiedBays(getOccupiedBays());

        if (isDuplicate || response.action === "updated") {
          addToast?.("Vehicle moved successfully", "success");
        } else {
          addToast?.("Vehicle saved to Neon successfully!", "success");
        }

        setStep("done");
      } else {
        addToast?.("Failed to save vehicle", "error");
      }
    } catch (error: any) {
      // THIS WILL NOW SHOW EXACTLY WHY NEON IS FAILING
      console.error("Save Error:", error);
      addToast?.(`Error: ${error.message || "Connection refused"}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!carNumber.trim() || !bayNumber.trim()) return;

    // 1. Check if bay is occupied by a different vehicle
    const occupant = getBayOccupant(bayNumber.trim());
    if (
      occupant &&
      occupant.car_number.toUpperCase() !== carNumber.trim().toUpperCase()
    ) {
      setBayOccupantPlate(occupant.car_number);
      setShowBayOccupiedModal(true);
      return;
    }

    // 2. Check duplicate via API
    if (!isDuplicate) {
      setCheckingDuplicate(true);
      try {
        const findResp = await apiFindVehicle(carNumber.trim());
        if (
          findResp.found &&
          findResp.bay_number &&
          findResp.bay_number.toUpperCase() !== bayNumber.trim().toUpperCase()
        ) {
          setIsDuplicate(true);
          setExistingBay(findResp.bay_number);
          setCheckingDuplicate(false);
          setShowDuplicateModal(true);
          return;
        }
      } catch {
        // Offline — proceed without duplicate check
      }
      setCheckingDuplicate(false);
    } else if (existingBay.toUpperCase() !== bayNumber.trim().toUpperCase()) {
      setShowDuplicateModal(true);
      return;
    }

    // 3. Save
    doSave();
  };

  // ─── Reset ───

  const handleReset = () => {
    setStep("capture");
    setImagePreview(null);
    setCarNumber("");
    setBayNumber("");
    setOcrStatus("idle");
    setIsDuplicate(false);
    setExistingBay("");
    setShowDuplicateModal(false);
    setShowBayOccupiedModal(false);
    setCustomBay("");
    setSaving(false);
    setCheckingDuplicate(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const canSave = carNumber.trim() && bayNumber.trim();

  return (
    <div className="pt-5 pb-4">
      <AnimatePresence mode="wait">
        {/* ═══════════════ Step 1: Capture ═══════════════ */}
        {step === "capture" && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-xl font-semibold text-[#1A1D23] mb-0.5">
              Park Vehicle
            </h2>
            <p className="text-sm text-[#6B7280] mb-6">
              Scan or upload number plate
            </p>

            {/* Capture Zone */}
            <div className="rounded-2xl border-2 border-dashed border-[#0A1F44]/20 bg-[#EEF2F8] p-7 flex flex-col items-center gap-3 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-[#0A1F44]/8 flex items-center justify-center">
                <Camera className="w-8 h-8 text-[#0A1F44]" />
              </div>
              <p className="text-sm text-[#6B7280] text-center">
                Take a photo of the number plate
              </p>

              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A1F44] text-white font-semibold text-sm press-scale shadow-sm shadow-[#0A1F44]/20"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#0A1F44] text-[#0A1F44] font-semibold text-sm press-scale"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Manual Entry */}
            <button
              onClick={handleManualEntry}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-[#0A1F44] text-sm font-medium hover:underline"
            >
              <Type className="w-4 h-4" />
              Type number manually
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* ═══════════════ Step 2: Processing ═══════════════ */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex flex-col items-center justify-center py-16"
          >
            {/* Image Preview Thumbnail */}
            {imagePreview && (
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#0A1F44]/10 mb-6 shadow-lg">
                <img
                  src={imagePreview}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Scanning Animation */}
            <div className="relative w-20 h-20 mb-5">
              <div className="absolute inset-0 rounded-full border-4 border-[#DDE3EE]" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#0A1F44] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ScanLine className="w-7 h-7 text-[#0A1F44] animate-pulse" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-[#1A1D23] mb-1">
              Scanning number plate...
            </h3>
            <p className="text-sm text-[#9CA3AF]">
              AI is extracting vehicle number
            </p>
          </motion.div>
        )}

        {/* ═══════════════ Step 3: Confirm ═══════════════ */}
        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <h2 className="text-xl font-semibold text-[#1A1D23] mb-0.5">
              Park Vehicle
            </h2>
            <p className="text-sm text-[#6B7280] mb-5">
              Verify plate and select bay
            </p>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mb-4 rounded-xl overflow-hidden border border-[#DDE3EE]">
                <img
                  src={imagePreview}
                  alt="Captured"
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 shadow-sm press-scale"
                >
                  <X className="w-3.5 h-3.5 text-[#6B7280]" />
                </button>
              </div>
            )}

            {/* ── AI Detection Status Badges ── */}

            {ocrStatus === "detected" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#EEF4FF] border border-[#1A6FE8]/20"
              >
                <Sparkles className="w-4 h-4 text-[#1A6FE8]" />
                <span className="text-xs font-semibold text-[#1A6FE8]">
                  Detected by AI
                </span>
                <span className="text-[10px] text-[#1A6FE8]/60 ml-auto">
                  Gemini Vision
                </span>
              </motion.div>
            )}

            {ocrStatus === "not_found" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-semibold text-amber-800">
                    Couldn't detect number plate
                  </span>
                </div>
                <button
                  onClick={() => {
                    setOcrStatus("idle");
                    const input = document.getElementById("car-number-input");
                    input?.focus();
                  }}
                  className="text-xs font-semibold text-[#0A1F44] hover:underline flex items-center gap-1"
                >
                  Enter manually <ArrowRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {ocrStatus === "unavailable" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#E24B4A]" />
                  <span className="text-xs font-semibold text-red-800">
                    AI unavailable. Enter number manually.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setOcrStatus("idle");
                    const input = document.getElementById("car-number-input");
                    input?.focus();
                  }}
                  className="text-xs font-semibold text-[#0A1F44] hover:underline flex items-center gap-1"
                >
                  Enter manually <ArrowRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {/* ── Vehicle Number Input ── */}

            <div className="mb-5">
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5 px-0.5">
                Vehicle Number
              </label>
              <input
                id="car-number-input"
                type="text"
                value={carNumber}
                onChange={(e) => {
                  setCarNumber(e.target.value.toUpperCase());
                  // If user edits, remove AI-detected status
                  if (ocrStatus === "detected") setOcrStatus("idle");
                  setIsDuplicate(false);
                }}
                placeholder="TN12BK6756"
                className={`w-full h-14 px-4 rounded-xl bg-[#F9FAFB] text-[#1A1D23] font-mono text-lg font-bold placeholder-[#9CA3AF]/60 focus:outline-none focus:ring-2 transition-all ${
                  ocrStatus === "detected"
                    ? "border-2 border-[#1D9E75] focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]"
                    : "border border-[#DDE3EE] focus:ring-[#0A1F44]/10 focus:border-[#0A1F44]"
                }`}
              />
            </div>

            {/* ── Bay Selection ── */}

            <div className="mb-5">
              <label className="block text-xs font-medium text-[#6B7280] mb-2 px-0.5">
                Select Bay
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {BAY_OPTIONS.map((bay) => {
                  const isSelected = bayNumber === bay;
                  const isOccupied = occupiedBays.includes(bay) && !isSelected;
                  return (
                    <button
                      key={bay}
                      onClick={() => handleBaySelect(bay)}
                      className={`h-11 rounded-xl text-sm font-semibold press-scale transition-all ${
                        isSelected
                          ? "bg-[#0A1F44] text-white shadow-sm shadow-[#0A1F44]/20"
                          : isOccupied
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-white text-[#6B7280] border border-[#DDE3EE] hover:border-[#0A1F44]/40"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {isOccupied && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                        {bay}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Bay Input */}
              <input
                type="text"
                value={customBay}
                onChange={(e) => handleCustomBay(e.target.value)}
                placeholder="Or type custom bay..."
                className="w-full h-11 px-4 rounded-xl bg-white border border-[#DDE3EE] text-[#1A1D23] font-mono text-sm font-semibold placeholder-[#9CA3AF]/60 focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/10 focus:border-[#0A1F44] transition-all"
              />
            </div>

            {/* ── Duplicate Warning ── */}

            {isDuplicate && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">
                    Vehicle already parked
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Currently in Bay{" "}
                    <span className="font-mono font-bold">{existingBay}</span>.
                    Saving will move it.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Action Buttons ── */}

            <div className="flex gap-3 mt-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white border border-[#DDE3EE] text-[#6B7280] font-medium text-sm press-scale hover:bg-[#F4F6FA] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Rescan
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saving || checkingDuplicate}
                className={`flex-1 h-14 rounded-[14px] font-semibold text-sm press-scale transition-all flex items-center justify-center gap-2 ${
                  canSave && !saving && !checkingDuplicate
                    ? "bg-[#0A1F44] text-white shadow-sm shadow-[#0A1F44]/20 hover:bg-[#1A3563]"
                    : "bg-[#DDE3EE] text-[#9CA3AF] cursor-not-allowed"
                }`}
              >
                {checkingDuplicate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : canSave ? (
                  <>
                    <Check className="w-4 h-4" />
                    Save Vehicle
                  </>
                ) : (
                  "Enter plate and bay"
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ Step 4: Done ═══════════════ */}
        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-[#1D9E75] flex items-center justify-center mb-5 shadow-lg shadow-[#1D9E75]/20"
            >
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </motion.div>
            <h3 className="text-xl font-semibold text-[#1A1D23] mb-1">
              Vehicle Parked!
            </h3>
            <p className="text-sm text-[#9CA3AF] mb-6">
              Record saved successfully
            </p>

            <div className="w-full max-w-xs p-5 rounded-2xl bg-white border border-[#DDE3EE] mb-7">
              <div className="text-center space-y-3">
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium">
                    Vehicle Number
                  </p>
                  <p className="text-xl font-bold font-mono text-[#1A1D23] mt-1">
                    {carNumber}
                  </p>
                </div>
                <div className="w-10 h-px bg-[#DDE3EE] mx-auto" />
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium">
                    Bay Number
                  </p>
                  <p className="text-xl font-bold font-mono text-[#0A1F44] mt-1">
                    {bayNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#DDE3EE] text-[#6B7280] font-semibold text-sm press-scale"
              >
                <Camera className="w-4 h-4" />
                Park Another
              </button>
              <button
                onClick={() => onNavigate?.("home")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0A1F44] text-white font-semibold text-sm press-scale shadow-sm shadow-[#0A1F44]/20"
              >
                Go Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ Duplicate Vehicle Modal ═══════════════ */}
      <AnimatePresence>
        {showDuplicateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end justify-center p-4 pb-8"
            onClick={() => setShowDuplicateModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[398px] bg-white rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-4.5 h-4.5 text-[#F59E0B]" />
                </div>
                <h3 className="text-base font-semibold text-[#1A1D23]">
                  Vehicle Already Exists
                </h3>
              </div>
              <p className="text-sm text-[#6B7280] mb-1">
                <span className="font-mono font-bold text-[#1A1D23]">
                  {carNumber}
                </span>{" "}
                already exists in Bay{" "}
                <span className="font-mono font-bold text-[#0A1F44]">
                  {existingBay}
                </span>
                .
              </p>
              <p className="text-sm text-[#6B7280] mb-5">
                Move vehicle to{" "}
                <span className="font-mono font-bold text-[#1D9E75]">
                  {bayNumber}
                </span>
                ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setIsDuplicate(false);
                  }}
                  className="flex-1 h-11 rounded-xl bg-[#F4F6FA] border border-[#DDE3EE] text-[#6B7280] font-medium text-sm press-scale"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    doSave();
                  }}
                  className="flex-1 h-11 rounded-xl bg-[#0A1F44] text-white font-semibold text-sm press-scale"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ Bay Occupied Modal ═══════════════ */}
      <AnimatePresence>
        {showBayOccupiedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end justify-center p-4 pb-8"
            onClick={() => setShowBayOccupiedModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[398px] bg-white rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-4.5 h-4.5 text-[#F59E0B]" />
                </div>
                <h3 className="text-base font-semibold text-[#1A1D23]">
                  Bay Already Occupied
                </h3>
              </div>
              <p className="text-sm text-[#6B7280] mb-5">
                Bay{" "}
                <span className="font-mono font-bold text-[#0A1F44]">
                  {bayNumber}
                </span>{" "}
                already contains{" "}
                <span className="font-mono font-bold text-[#1A1D23]">
                  {bayOccupantPlate}
                </span>
                . Move anyway?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBayOccupiedModal(false)}
                  className="flex-1 h-11 rounded-xl bg-[#F4F6FA] border border-[#DDE3EE] text-[#6B7280] font-medium text-sm press-scale"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowBayOccupiedModal(false);
                    doSave();
                  }}
                  className="flex-1 h-11 rounded-xl bg-[#0A1F44] text-white font-semibold text-sm press-scale"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
