"use client";

export default function WorkforceTrainingAssessmentMobilePolish() {
  return (
    <style>{`
      /* Keep all five assessment settings on one visual system. */
      .nsa-config {
        align-items: stretch;
      }

      .nsa-config > label {
        min-width: 0;
      }

      /* Toggle settings now follow the same label + control rhythm as Questions / Passing score. */
      .nsa-config .nsa-toggle {
        position: relative;
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        justify-content: flex-start !important;
        gap: 5px;
        min-height: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        overflow: visible;
      }

      .nsa-toggle > span {
        order: 0;
        min-height: 20px;
        color: #506b80;
        font-size: 8px;
        font-weight: 850;
        line-height: 1.25;
      }

      /* Draw the same control box used by the numeric fields, without another nested card. */
      .nsa-toggle::before {
        content: "";
        order: 1;
        display: block;
        width: 100%;
        height: 34px;
        min-height: 34px;
        border: 1px solid #cfdbe4;
        border-radius: 7px;
        background: #fff;
        box-sizing: border-box;
      }

      .nsa-toggle input[type="checkbox"] {
        -webkit-appearance: none;
        appearance: none;
        position: absolute;
        left: 9px;
        bottom: 7px;
        z-index: 2;
        width: 20px;
        height: 20px;
        min-width: 20px;
        min-height: 20px;
        margin: 0;
        display: grid;
        place-content: center;
        border: 1.5px solid #9db3c4;
        border-radius: 5px;
        background: #fff;
        cursor: pointer;
        transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease;
      }

      .nsa-toggle input[type="checkbox"]::after {
        content: "";
        width: 5px;
        height: 10px;
        margin-top: -2px;
        border: solid #fff;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg) scale(0);
        transform-origin: center;
        transition: transform .12s ease;
      }

      .nsa-toggle input[type="checkbox"]:checked {
        border-color: #0a66b7;
        background: #0a66b7;
      }

      .nsa-toggle input[type="checkbox"]:checked::after {
        transform: rotate(45deg) scale(1);
      }

      .nsa-toggle input[type="checkbox"]:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(10, 102, 183, .18);
      }

      /* The separate Not Generated pill repeats state already communicated by the action. */
      .nsa-card:not(.nsa-training) .nsa-actions > .nsa-badge {
        display: none;
      }

      @media (max-width: 900px) {
        .nsa-config {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 620px) {
        .nsa-card {
          padding: 14px;
        }

        .nsa-heading {
          gap: 12px;
        }

        .nsa-heading > svg {
          flex: 0 0 auto;
        }

        .nsa-config {
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 12px;
        }

        .nsa-config label:not(.nsa-toggle),
        .nsa-config .nsa-toggle {
          gap: 6px;
        }

        .nsa-config input[type="number"],
        .nsa-toggle::before {
          min-height: 44px;
          height: 44px;
        }

        .nsa-config input[type="number"] {
          font-size: 14px;
        }

        .nsa-toggle > span {
          min-height: 0;
          font-size: 12px;
          line-height: 1.3;
        }

        .nsa-toggle input[type="checkbox"] {
          left: 12px;
          bottom: 12px;
          width: 20px;
          height: 20px;
          min-width: 20px;
          min-height: 20px;
        }

        .nsa-actions {
          align-items: stretch;
          flex-direction: column;
        }

        .nsa-actions button.primary {
          min-height: 44px;
          justify-content: center;
        }
      }
    `}</style>
  );
}
