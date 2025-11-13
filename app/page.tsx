"use client";

import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const router = useRouter();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} type="button">
        ✕
      </button>

      <div className={styles.content}>
        <div className={styles.waitlistForm}>
          <h1 className={styles.title}>Welcome to LA MONJERIA</h1>

          <p className={styles.subtitle}>
            Hey {context?.user?.displayName || "there"}, choose your path:
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
            <button
              onClick={() => router.push("/create")}
              className={styles.joinButton}
            >
              🧘 Create
            </button>

            <button
              onClick={() => router.push("/music")}
              className={styles.joinButton}
            >
              🎵 Play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
