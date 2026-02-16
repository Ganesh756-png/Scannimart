"use client";

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

const qrcodeRegionId = "html5qr-code-full-region";

interface Html5QrcodePluginProps {
    fps?: number;
    qrbox?: number;
    disableFlip?: boolean;
    verbose?: boolean;
    qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void;
    qrCodeErrorCallback?: (errorMessage: string) => void;
}

const Html5QrcodePlugin = (props: Html5QrcodePluginProps) => {

    useEffect(() => {
        // when component mounts
        const config = {
            fps: props.fps || 10,
            qrbox: props.qrbox || 250,
            disableFlip: props.disableFlip || false,
        };

        const verbose = props.verbose === true;

        // Sucess callback is required.
        if (!props.qrCodeSuccessCallback) {
            throw "qrCodeSuccessCallback is required callback.";
        }

        const html5QrcodeScanner = new Html5QrcodeScanner(
            qrcodeRegionId, config, verbose);

        html5QrcodeScanner.render(
            props.qrCodeSuccessCallback,
            props.qrCodeErrorCallback);

        // cleanup function when component will unmount
        return () => {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, []);

    return (
        <div id={qrcodeRegionId} className="w-full max-w-sm mx-auto touch-none" />
    );
};

export default Html5QrcodePlugin;
