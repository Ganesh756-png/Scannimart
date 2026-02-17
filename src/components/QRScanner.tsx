import { useEffect, useState, useRef, memo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { toast } from 'react-hot-toast';

interface QRScannerProps {
    onScanSuccess: (decodedText: string, decodedResult: any) => void;
    onScanFailure?: (error: any) => void;
}

// Isolated Scanner Area to prevent re-renders
const QRScannerArea = memo(({ isScanning }: { isScanning: boolean }) => {
    return (
        <div
            id="html5qr-code-full-region"
            className={`w-full h-full bg-black rounded-lg overflow-hidden ${!isScanning ? 'hidden' : 'block'}`}
        ></div>
    );
});

QRScannerArea.displayName = 'QRScannerArea';

const QRScanner = ({ onScanSuccess, onScanFailure }: QRScannerProps) => {
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const regionId = "html5qr-code-full-region";
    const isMounted = useRef(true);
    const isProcessing = useRef(false); // Lock for async operations

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            cleanupScanner();
        };
    }, []);

    const cleanupScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (error) {
                console.error("Error clearing scanner:", error);
            }
        }
    };

    const startScanning = async () => {
        if (isProcessing.current) return;
        if (scannerRef.current?.isScanning) return;

        isProcessing.current = true;

        try {
            // 1. Make the container visible first
            setIsScanning(true);

            // 2. Wait for React to render the visible div
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!isMounted.current) return;

            // 3. Initialize scanner if needed
            if (!scannerRef.current) {
                const formatsToSupport = [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.EAN_13, // Books/ISBN
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128
                ];
                scannerRef.current = new Html5Qrcode(regionId, { formatsToSupport, verbose: false });
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            // 4. Start scanning
            await scannerRef.current.start(
                { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => {
                    if (isMounted.current) {
                        onScanSuccess(decodedText, decodedResult);
                        stopScanning();
                    }
                },
                (errorMessage) => {
                    // Reduce noise for scan failures
                    if (onScanFailure) onScanFailure(errorMessage);
                }
            );

        } catch (err: any) {
            console.error("Error starting scanner:", err);

            // Revert state if failed
            if (isMounted.current) setIsScanning(false);

            let msg = "Failed to access camera.";
            if (err.name === 'NotAllowedError') {
                msg = "Permission denied. Check browser settings.";
            } else if (err.name === 'NotFoundError') {
                msg = "No camera found.";
            } else if (err?.toString().includes("already")) {
                msg = "Camera is busy. Please try again.";
            }
            toast.error(msg);
        } finally {
            isProcessing.current = false;
        }
    };

    const stopScanning = async () => {
        if (isProcessing.current) return;
        if (!scannerRef.current || !scannerRef.current.isScanning) {
            if (isMounted.current) setIsScanning(false);
            return;
        }

        isProcessing.current = true;
        try {
            await scannerRef.current.stop();
            if (isMounted.current) setIsScanning(false);
        } catch (err) {
            console.error("Failed to stop scanner", err);
            // Even if stop fails, we try to update UI
            if (isMounted.current) setIsScanning(false);
        } finally {
            isProcessing.current = false;
        }
    };

    // Auto-start on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            startScanning();
        }, 800); // Slightly longer delay to ensure full page load
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
            <div className="w-full h-[300px] relative bg-black rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 shadow-inner">
                {/* The scanner renders into this component */}
                <QRScannerArea isScanning={isScanning} />

                {/* Fallback UI when not scanning */}
                {!isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-100 z-10">
                        <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
                            <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p className="font-medium">Camera Paused</p>
                        <button
                            onClick={startScanning}
                            className="mt-3 text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium transition shadow-sm"
                        >
                            Tap to Scan
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-4">
                {isScanning && (
                    <button
                        type="button"
                        onClick={stopScanning}
                        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition font-semibold shadow-md flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Stop Camera
                    </button>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
