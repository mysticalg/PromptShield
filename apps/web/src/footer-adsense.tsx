import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    __FOOTER_ADSENSE__?: {
      client?: string;
      slot?: string;
    };
    adsbygoogle?: unknown[];
  }
}

type FooterAdSenseConfig = {
  client: string;
  slot: string;
};

function readFooterAdSenseConfig(): FooterAdSenseConfig | null {
  const client = window.__FOOTER_ADSENSE__?.client?.trim();
  const slot = window.__FOOTER_ADSENSE__?.slot?.trim();

  if (!client || !slot) {
    return null;
  }

  return { client, slot };
}

export function FooterAdSense() {
  const adRef = useRef<HTMLModElement | null>(null);
  const [config, setConfig] = useState<FooterAdSenseConfig | null>(null);

  useEffect(() => {
    setConfig(readFooterAdSenseConfig());
  }, []);

  useEffect(() => {
    if (!config || !adRef.current) {
      return;
    }

    adRef.current.dataset.adClient = config.client;
    adRef.current.dataset.adSlot = config.slot;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("Footer AdSense failed to render", error);
    }
  }, [config]);

  if (!config) {
    return null;
  }

  return (
    <div className="footer-adsense">
      <p className="footer-adsense__label">Advertisement</p>
      <ins
        ref={adRef}
        className="adsbygoogle footer-adsense__unit"
        style={{ display: "block" }}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
