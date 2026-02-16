import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { toast } from 'react-hot-toast';

interface QRScannerProps {
    onScanSuccess: (decodedText: string, decodedResult: any) => void;
    onScanFailure?: (error: any) => void;
}

const QRScanner = ({ onScanSuccess, onScanFailure }: QRScannerProps) => {
    const [isScanning, setIsScanning] = useState(false);
    const [cameraId, setCameraId] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const regionId = "html5qr-code-full-region";

    useEffect(() => {
        // Initialize the scanner instance
        scannerRef.current = new Html5Qrcode(regionId);

        return () => {
            if (scannerRef.current && isScanning) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner on cleanup", err));
            }
        };
    }, []);

    const startScanning = async () => {
        try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length) {
                const cameraId = devices[0].id; // Use the first camera
                setCameraId(cameraId);

                if (!scannerRef.current) return;

                await scannerRef.current.start(
                    cameraId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText, decodedResult) => {
                        onScanSuccess(decodedText, decodedResult);
                        stopScanning(); // Auto-stop on success
                    },
                    (errorMessage) => {
                        if (onScanFailure) onScanFailure(errorMessage);
                    }
                );
                setIsScanning(true);
            } else {
                toast.error("No camera found on this device.");
            }
        } catch (err: any) {
            console.error("Error starting scanner:", err);
            let msg = "Failed to access camera.";
            if (err.name === 'NotAllowedError') {
                msg = "Camera permission denied. Please allow camera access in your browser settings.";
            } else if (err.name === 'NotFoundError') {
                msg = "No camera found.";
            }
            toast.error(msg);
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                setIsScanning(false);
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
            <div id={regionId} className="w-full overflow-hidden rounded-lg bg-gray-100 min-h-[300px] border-2 border-dashed border-gray-300 flex items-center justify-center relative">
                {!isScanning && (
                    <p className="text-gray-400 text-sm absolute">Camera is off</p>
                )}
            </div>

            <div className="flex gap-4">
                {!isScanning ? (
                    <button
                        type="button"
                        onClick={startScanning}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold"
                    >
                        Start Camera
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={stopScanning}
                        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition font-semibold"
                    >
                        Stop Camera
                    </button>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
