/**
 * @license Apache-2.0
 * Avenora — account-opening welcome before registration
 *
 * Visual matches the approved welcome artwork. Get Started is a real control
 * aligned to the pill in the artwork at every viewport size.
 */

import React, { useCallback, useEffect, useId, useRef } from 'react';
import { useAuth } from '../AuthContext.tsx';

/** Reference artwork (593×1024). */
const WELCOME_ART_SRC = '/images/account-opening-welcome.jpg';
const ART_WIDTH = 593;
const ART_HEIGHT = 1024;
const ART_RATIO = ART_WIDTH / ART_HEIGHT;

/** Measured from the reference JPEG (white pill). */
const CTA_BOX = {
  left: 0.069,
  top: 0.901,
  width: 0.871,
  height: 0.058,
};

export const AccountOpeningWelcome: React.FC = () => {
  const {
    accountOpeningWelcomeOpen,
    dismissAccountOpeningWelcome,
    proceedToRegistrationFromWelcome,
  } = useAuth();

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const proceedLockRef = useRef(false);

  useEffect(() => {
    if (!accountOpeningWelcomeOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [accountOpeningWelcomeOpen]);

  useEffect(() => {
    if (!accountOpeningWelcomeOpen) return;
    dialogRef.current?.focus();
  }, [accountOpeningWelcomeOpen]);

  useEffect(() => {
    if (!accountOpeningWelcomeOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismissAccountOpeningWelcome();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [accountOpeningWelcomeOpen, dismissAccountOpeningWelcome]);

  const handleProceed = useCallback(() => {
    if (proceedLockRef.current) return;
    proceedLockRef.current = true;
    proceedToRegistrationFromWelcome();
    window.setTimeout(() => {
      proceedLockRef.current = false;
    }, 400);
  }, [proceedToRegistrationFromWelcome]);

  if (!accountOpeningWelcomeOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          dismissAccountOpeningWelcome();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative overflow-hidden bg-[#01241f] outline-none shadow-[0_24px_80px_rgba(0,0,0,0.55)] max-sm:h-[100dvh] max-sm:w-full max-sm:max-w-none max-sm:rounded-none sm:rounded-[2rem] sm:h-auto sm:max-h-[min(100dvh,920px)] sm:w-[min(100vw,calc(min(100dvh,920px)*593/1024))] sm:aspect-[593/1024]"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={WELCOME_ART_SRC}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none"
          width={ART_WIDTH}
          height={ART_HEIGHT}
          draggable={false}
          decoding="async"
        />

        <h1 id={titleId} className="sr-only">
          Your Money Better Days. Save, spend, and grow your wealth — all in one simple place.
        </h1>

        {/* Skip: same destination as Get Started; kept off-canvas visually to match artwork */}
        <button
          type="button"
          onClick={handleProceed}
          className="sr-only"
        >
          Skip to registration
        </button>

        <button
          type="button"
          onClick={handleProceed}
          aria-label="Get Started"
          className="absolute z-10 cursor-pointer border-0 bg-transparent p-0 m-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#01241f]"
          style={{
            left: `${CTA_BOX.left * 100}%`,
            top: `${CTA_BOX.top * 100}%`,
            width: `${CTA_BOX.width * 100}%`,
            height: `${CTA_BOX.height * 100}%`,
            color: 'transparent',
            fontSize: 0,
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};
