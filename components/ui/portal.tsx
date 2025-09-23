"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
    children: React.ReactNode;
}

export function Portal({ children }: PortalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        console.log("🌐 Portal mounting...");
        setMounted(true);
        return () => {
            console.log("🌐 Portal unmounting...");
            setMounted(false);
        };
    }, []);

    if (!mounted) {
        console.log("⏳ Portal not mounted yet");
        return null;
    }

    console.log("🚀 Portal rendering to document.body");
    return createPortal(children, document.body);
}
